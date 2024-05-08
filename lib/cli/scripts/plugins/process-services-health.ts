/*!
 * @license
 * Copyright © 2005-2024 Hyland Software, Inc. and its affiliates. All rights reserved.
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

import { PluginInterface } from './plugin-model';
import { logger } from '../logger';
import { PluginConfiguration } from './plugin-config';
import { AlfrescoApi, SystemPropertiesApi } from '@alfresco/js-api';

export class ProcessServiceHealth {
    config: PluginConfiguration;

    constructor(private plugInInfo: PluginInterface, private alfrescoJsApi: AlfrescoApi) {
        this.config = new PluginConfiguration(this.plugInInfo, this.alfrescoJsApi);
    }

    async isPluginEnabledFromAppConfiguration(): Promise<boolean> {
        try {
            const url = `${this.plugInInfo.host}/app.config.json`;
            const appConfig = await this.config.getAppConfig(url);
            let isEnabled = true;
            if (appConfig?.plugins?.[this.plugInInfo.name]) {
                logger.info(`The plugin ${this.plugInInfo.name} has been correctly configured in app.config.json`);
            } else {
                this.logConfigurationError();
                return (isEnabled = false);
            }

            return isEnabled;
        } catch (error) {
            this.logConfigurationError(error);
            return false;
        }
    }

    async checkBackendHealth(): Promise<boolean> {
        try {
            const systemPropertiesApi = new SystemPropertiesApi(this.alfrescoJsApi);
            const systemProperties = await systemPropertiesApi.getProperties();
            let isBackendActive = true;
            if (systemProperties) {
                logger.info(`${this.plugInInfo.host} is UP!`);
            } else {
                logger.error(`${this.plugInInfo.host} is DOWN `);
                isBackendActive = false;
            }
            return isBackendActive;
        } catch (error) {
            logger.error(`${this.plugInInfo.host} is not reachable error: `, error);
            return false;
        }
    }

    private logConfigurationError(error?: any): void {
        logger.error(`The plugin ${this.plugInInfo.name} has not been correctly configured in app.config.json`, error);
    }
}
