/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
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

import {
    ApiService,
    ApplicationsUtil,
    LoginSSOPage,
    StartProcessPage,
    UsersActions,
    Widget
} from '@alfresco/adf-testing';
import { ProcessFiltersPage } from '../pages/adf/process-services/process-filters.page';
import { ProcessDetailsPage } from '../pages/adf/process-services/process-details.page';
import { TaskDetailsPage } from '../pages/adf/process-services/task-details.page';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import { browser } from 'protractor';
import { ProcessServiceTabBarPage } from '../pages/adf/process-services/process-service-tab-bar.page';

describe('Form widgets - People ', () => {

    const app = browser.params.resources.Files.APP_WITH_USER_WIDGET;

    const loginPage = new LoginSSOPage();
    const processFiltersPage = new ProcessFiltersPage();
    const startProcess = new StartProcessPage();
    const processDetailsPage = new ProcessDetailsPage();
    const taskDetails = new TaskDetailsPage();
    const processServiceTabBarPage = new ProcessServiceTabBarPage();
    const widget = new Widget();

    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);

    let processUserModel;
    let appModel;

    beforeAll(async () => {
        await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        processUserModel = await usersActions.createUser();

        await apiService.getInstance().login(processUserModel.email, processUserModel.password);

        const applicationsService = new ApplicationsUtil(apiService);

        appModel = await applicationsService.importPublishDeployApp(app.file_path);

        await loginPage.login(processUserModel.email, processUserModel.password);
    });

    afterAll(async () => {
        await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        await apiService.getInstance().activiti.adminTenantsApi.deleteTenant(processUserModel.tenantId);
    });

    beforeEach(async () => {
        await (await (await new NavigationBarPage().navigateToProcessServicesPage()).goToApp(appModel.name)).clickProcessButton();
        await processFiltersPage.clickCreateProcessButton();
        await processFiltersPage.clickNewProcessDropdown();

        await widget.peopleWidget().checkPeopleFieldIsDisplayed();
        await widget.peopleWidget().fillPeopleField(processUserModel.firstName);
        await widget.peopleWidget().selectUserFromDropdown();
    });

    it('[C286577] Should be able to start a process with people widget', async () => {
        await startProcess.clickFormStartProcessButton();
        await processDetailsPage.clickOnActiveTask();

        const taskId = await taskDetails.getId();
        const taskForm: any = await apiService.getInstance().activiti.taskApi.getTaskForm(taskId);
        const userEmail = taskForm['fields'][0].fields['1'][0].value.email;
        await expect(userEmail).toEqual(processUserModel.email);
    });

    it('[C286576] Should be able to see user in completed task', async () => {
        await startProcess.enterProcessName(app.processName);
        await startProcess.clickFormStartProcessButton();

        await processDetailsPage.clickOnActiveTask();
        await taskDetails.checkCompleteFormButtonIsDisplayed();
        await taskDetails.clickCompleteFormTask();

        await processServiceTabBarPage.clickProcessButton();
        await processFiltersPage.clickCompletedFilterButton();
        await processFiltersPage.selectFromProcessList(app.processName);

        await processDetailsPage.clickOnCompletedTask();

        const taskId = await taskDetails.getId();
        const taskForm: any = await apiService.getInstance().activiti.taskApi.getTaskForm(taskId);
        const userEmail = taskForm['fields'][0].fields['1'][0].value.email;
        await expect(userEmail).toEqual(processUserModel.email);
    });
});
