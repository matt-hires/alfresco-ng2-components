/*!
 * @license
 * Copyright © 2005-2023 Hyland Software, Inc. and its affiliates. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AdminTenantsApi, AdminUsersApi, AlfrescoApi, TenantRepresentation, AppDefinitionsApi, RuntimeAppDefinitionsApi, UserRepresentation } from '@alfresco/js-api';
import { argv, exit } from 'node:process';
import { spawnSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
const program = require('commander');
const path = require('path');
import { logger } from './logger';
const { throwError } = require('rxjs');
const MAX_RETRY = 10;
let counter = 0;
const TIMEOUT = 6000;
const TENANT_DEFAULT_ID = 1;
const TENANT_DEFAULT_NAME = 'default';
const CONTENT_DEFAULT_NAME = 'adw-content';
const ACTIVITI_APPS = require('./resources').ACTIVITI_APPS;

let alfrescoJsApi: AlfrescoApi;

export default async function() {
    await main();
}

async function main() {

    program
        .version('0.1.0')
        .option('--host [type]', 'Remote environment host')
        .option('--clientId [type]', 'sso client', 'alfresco')
        .option('-p, --password [type]', 'password ')
        .option('-u, --username [type]', 'username ')
        .option('--license [type]', 'APS license S3 path ')
        .parse(argv);

    await checkEnv();

    logger.info(`***** Step 1 - Check License *****`);

    let licenceUploaded = false;
    const hasValidLicense = await hasLicense() ;
    if (!hasValidLicense) {
        logger.info(`Aps License missing`);
        const isLicenseFileDownloaded = await downloadLicenseFile(program.license);
        if (isLicenseFileDownloaded) {
            licenceUploaded = await updateLicense();
        }
    } else {
        licenceUploaded = true;
        logger.info(`Aps License present`);
    }
    let tenantId;
    if (licenceUploaded) {
        logger.info(`***** Step 2 - Check Tenant *****`);
        logger.info(`is tenantId:${TENANT_DEFAULT_ID} with name:${TENANT_DEFAULT_NAME} present?`);
        try {
            const hasDefault = await hasDefaultTenant(TENANT_DEFAULT_ID, TENANT_DEFAULT_NAME);
            tenantId = TENANT_DEFAULT_ID;
            if (!hasDefault) {
                // the tenantId should be equal to TENANT_DEFAULT_ID if we choose 1 as id.
                tenantId = await createDefaultTenant(TENANT_DEFAULT_NAME);
            }
            logger.info(`***** Step 3 - Add Content Repo *****`);
            const isContentPresent = await isContentRepoPresent(TENANT_DEFAULT_ID, CONTENT_DEFAULT_NAME);
            if (!isContentPresent) {
                logger.info(`No content repo with name ${CONTENT_DEFAULT_NAME} found`);
                await addContentRepoWithBasic(TENANT_DEFAULT_ID, CONTENT_DEFAULT_NAME);
            }
            logger.info(`***** Step 4 - Create users *****`);
            const users = await getDefaultApsUsersFromRealm();
            if (tenantId && users && users.length > 0) {
                for (let i = 0; i < users.length; i++) {
                    await createUsers(tenantId, users[i]);
                }
                for (let i = 0; i < users.length; i++) {
                    logger.info('Impersonate user: ' + users[i].username);
                    await alfrescoJsApi.login(users[i].username, 'password');
                    await authorizeUserToContentRepo(users[i]);

                    const defaultUser = 'hruser';
                    if (users[i].username.includes(defaultUser)) {
                        logger.info(`***** Step initialize APS apps for user ${defaultUser} *****`);
                        await initializeDefaultApps();
                    }

                }
            } else {
                logger.info('Something went wrong. Was not able to create the users');
            }

        } catch (error) {
            logger.info(`Aps something went wrong. Tenant id ${tenantId}`);
            exit(1);
        }
    } else {
        logger.info('APS license error: check the configuration');
        exit(1);
    }

}

async function initializeDefaultApps() {
    for (let x = 0; x < ACTIVITI_APPS.apps.length; x++) {
        const appInfo = ACTIVITI_APPS.apps[x];
        const isDeployed = await isDefaultAppDeployed(appInfo.name);
        if (isDeployed !== undefined && !isDeployed) {
            const appDefinition = await importPublishApp(`${appInfo.name}`);
            await deployApp(appDefinition.appDefinition.id);
        } else {
            logger.info(`***** App ${appInfo.name} already deployed *****`);
        }
    }
}
async function checkEnv() {
    try {
        alfrescoJsApi = new AlfrescoApi({
            provider: 'ALL',
            hostBpm: program.host,
            hostEcm: program.host,
            authType: 'OAUTH',
            contextRoot: 'alfresco',
            oauth2: {
                host: `${program.host}/auth/realms/alfresco`,
                clientId: `${program.clientId}`,
                scope: 'openid',
                redirectUri: '/'
            }
        });
        await alfrescoJsApi.login(program.username, program.password);
    } catch (e) {
        if (e.error.code === 'ETIMEDOUT') {
            logger.error('The env is not reachable. Terminating');
            exit(1);
        }
        logger.info('Login error environment down or inaccessible');
        counter++;
        if (MAX_RETRY === counter) {
            logger.error('Give up');
            exit(1);
        } else {
            logger.error(`Retry in 1 minute attempt N ${counter}`);
            sleep(TIMEOUT);
            await checkEnv();
        }
    }
}

async function hasDefaultTenant(tenantId: number, tenantName: string) {
    let tenant: TenantRepresentation;

    try {
        const adminTenantsApi = new AdminTenantsApi(alfrescoJsApi);
        tenant = await adminTenantsApi.getTenant(tenantId);
    } catch (error) {
        logger.info(`Aps: does not have tenant with id: ${tenantId}`);
        return false;
    }

    if (tenant.name === tenantName) {
        logger.info(`Aps: has default tenantId: ${tenantId} and name ${tenantName}`);
        return true;
    } else {
        logger.info(`Wrong configuration. Another tenant has been created with id ${tenant.id} and name ${tenant.name}`);
        throwError(`Wrong configuration. Another tenant has been created with id ${tenant.id} and name ${tenant.name}`);
    }
}

async function createDefaultTenant(tenantName: string) {
    const tenantPost = {
        active: true,
        maxUsers: 10000,
        name : tenantName
    };

    try {
        const adminTenantsApi = new AdminTenantsApi(alfrescoJsApi);
        const tenant = await adminTenantsApi.createTenant(tenantPost);
        logger.info(`APS: Tenant ${tenantName} created with id: ${tenant.id}`);
        return tenant.id;
    } catch (error) {
        logger.info(`APS: not able to create the default tenant: ${JSON.parse(error.message)}` );
    }
}

async function createUsers(tenantId: number, user: any) {
    logger.info(`Create user ${user.email} on tenant: ${tenantId}`);
    const passwordCamelCase = 'Password';
    const userJson = new UserRepresentation({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: 'active',
        type: 'enterprise',
        password: passwordCamelCase,
        tenantId
    });

    try {
        const adminUsersApi = new AdminUsersApi(alfrescoJsApi);
        const userInfo = await adminUsersApi.createNewUser(userJson);
        logger.info(`APS: User ${userInfo.email} created with id: ${userInfo.id}`);
        return user;
    } catch (error) {
        logger.info(`APS: not able to create the default user: ${error.message}` );
    }
}

async function updateLicense() {
    const fileContent = createReadStream(path.join(__dirname, '/activiti.lic'));

    try {
        await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/activiti-app/app/rest/license`,
            'POST',
            {},
            {},
            {},
            { file: fileContent },
            {},
            ['multipart/form-data'],
            ['application/json']
        );
        logger.info(`Aps License uploaded!`);
        return true;
    } catch (error) {
        logger.error(`Aps License failed!`, error.message);
        return false;
    }
}

async function isDefaultAppDeployed(appName: string) {
    logger.info(`Verify ${appName} already deployed`);
    try {
        const runtimeAppDefinitionsApi = new RuntimeAppDefinitionsApi(alfrescoJsApi);
        const availableApps = await runtimeAppDefinitionsApi.getAppDefinitions();
        const defaultApp = availableApps.data?.filter(app => app.name?.includes(appName));
        return defaultApp && defaultApp.length > 0;
    } catch (error) {
        logger.error(`Aps app failed to import/Publish!`);
    }
}

async function importPublishApp(appName: string) {
    const appNameExtension = `../resources/${appName}.zip`;
    logger.info(`Import app ${appNameExtension}`);
    const pathFile = path.join(__dirname, appNameExtension);
    const fileContent = createReadStream(pathFile);

    try {
        const appDefinitionsApi = new AppDefinitionsApi(alfrescoJsApi);
        const result = await appDefinitionsApi.importAndPublishApp(fileContent, {renewIdmEntries: true});
        logger.info(`Aps app imported and published!`);
        return result;
    } catch (error) {
        logger.error(`Aps app failed to import/Publish!`, error.message);
    }
}

async function deployApp(appDefinitionId: number) {
    logger.info(`Deploy app with id ${appDefinitionId}`);
    const body = {
        appDefinitions: [{id: appDefinitionId}]
    };

    try {
        const runtimeAppDefinitionsApi = new RuntimeAppDefinitionsApi(alfrescoJsApi);
        await runtimeAppDefinitionsApi.deployAppDefinitions(body);
        logger.info(`Aps app deployed`);
    } catch (error) {
        logger.error(`Aps app failed to deploy!`);
    }
}

async function hasLicense(): Promise<boolean> {
    try {
        const license = await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/activiti-app/app/rest/license`,
            'GET',
            {},
            {},
            {},
            {},
            {},
            ['application/json'],
            ['application/json']
        );
        if (license && license.status === 'valid') {
            logger.info(`Aps has a valid License!`);
            return true;
        }
        logger.info(`Aps does NOT have a valid License!`);
        return false;
    } catch (error) {
        logger.error(`Aps not able to check the license` );
    }
}

async function getDefaultApsUsersFromRealm() {
    try {
        const users: any[] = await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/auth/admin/realms/alfresco/users`,
            'GET',
            {},
            { max: 1000 },
            {},
            {},
            {},
            ['application/json'],
            ['application/json']
        );
        const usernamesOfApsDefaultUsers = ['hruser', 'salesuser', 'superadminuser'];
        const apsDefaultUsers = users.filter(user => usernamesOfApsDefaultUsers.includes(user.username));
        logger.info(`Keycloak found ${apsDefaultUsers.length} users`);
        return apsDefaultUsers;
    } catch (error) {
        logger.error(`APS: not able to fetch user: ${error.message}` );
    }
}

async function isContentRepoPresent(tenantId: number, contentName: string): Promise<boolean> {
    try {
        const contentRepos = await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/activiti-app/app/rest/integration/alfresco?tenantId=${tenantId}`,
            'GET',
            {},
            {},
            {},
            {},
            {},
            ['application/json'],
            ['application/json']
        );
        return !!contentRepos.data.find(repo => repo.name === contentName);
    } catch (error) {
        logger.error(`APS: not able to create content: ${error.message}` );
    }
}

async function addContentRepoWithBasic(tenantId: number, name: string) {
    logger.info(`Create Content with name ${name} and basic auth`);

    const body = {
        alfrescoTenantId: '',
        authenticationType: 'basic',
        name,
        repositoryUrl: `${program.host}/alfresco`,
        shareUrl: `${program.host}/share`,
        // sitesFolder: '', not working on activiti 1.11.1.1
        tenantId,
        version: '6.1.1'
    };

    try {
        const content = await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/activiti-app/app/rest/integration/alfresco`,
            'POST',
            {},
            {},
            {},
            {},
            body,
            ['application/json'],
            ['application/json']
        );
        logger.info(`Content created!`);
        return content;
    } catch (error) {
        logger.error(`APS: not able to create content: ${error.message}` );
    }
}

async function authorizeUserToContentRepo(user: any) {
    logger.info(`Authorize user ${user.email}`);
    try {
        const content = await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/activiti-app/app/rest/integration/alfresco`,
            'GET',
            {},
            {},
            {},
            {},
            {},
            ['application/json'],
            ['application/json']
        );
        logger.info(`Found ${content.data?.length} contents`);
        if (content.data) {
            for (let i = 0; i < content.data.length; i++) {
                if (content.data[i].authenticationType === 'basic') {
                    await authorizeUserToContentWithBasic(user.username, content.data[i].id);
                }
            }
        }
        return;
    } catch (error) {
        logger.error(`APS: not able to authorize content: ${error.message}` );
    }
}

async function authorizeUserToContentWithBasic(username: string, contentId: string) {
    logger.info(`Authorize ${username} on contentId: ${contentId} in basic auth`);
    try {
        const body = {username, password: 'password'};
        const content = await alfrescoJsApi.oauth2Auth.callCustomApi(
            `${program.host}/activiti-app/app/rest/integration/alfresco/${contentId}/account`,
            'POST',
            {},
            {},
            {},
            {},
            body,
            ['application/json'],
            ['application/json']
        );
        logger.info(`User authorized!`);
        return content;
    } catch (error) {
        logger.error(`APS: not able to authorize content: ${error.message}` );
    }
}

async function downloadLicenseFile(apsLicensePath: string) {
    const args = [
        `s3`,
        `cp`,
        apsLicensePath,
        `./`
    ];
    const result = spawnSync(`aws`, args, {
        cwd: path.resolve(__dirname, `./`),
        shell: false
    });

    if (result.status !== 0) {
        logger.error(`Not able to download the APS license from S3 bucket.\nCommand aws ${args.join(' ')} - failed with:\n${result.output}`);
        return false;
    }
    logger.info(`Aps license file download from S3 bucket`);
    return true;
}

function sleep(delay: number) {
    const start = new Date().getTime();
    while (new Date().getTime() < start + delay) {  }
}
