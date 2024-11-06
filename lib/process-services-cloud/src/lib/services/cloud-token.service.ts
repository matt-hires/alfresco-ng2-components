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

import { InjectionToken } from '@angular/core';
import { PreferenceCloudServiceInterface } from './preference-cloud.interface';
import { TaskListCloudServiceInterface } from './task-list-cloud.service.interface';

export const PROCESS_LISTS_PREFERENCES_SERVICE_TOKEN = new InjectionToken<PreferenceCloudServiceInterface>('proccesses-list-preferences-cloud');

export const TASK_LIST_PREFERENCES_SERVICE_TOKEN = new InjectionToken<PreferenceCloudServiceInterface>('tasks-list-preferences-cloud');

export const PROCESS_FILTERS_SERVICE_TOKEN = new InjectionToken<PreferenceCloudServiceInterface>('proccess-filters-cloud');

export const TASK_FILTERS_SERVICE_TOKEN = new InjectionToken<PreferenceCloudServiceInterface>('task-filters-cloud');

export const TASK_LIST_CLOUD_TOKEN = new InjectionToken<TaskListCloudServiceInterface>('task-list-cloud');

/**
 * Token used to indicate the API used to search for tasks.
 * 'POST' value should be provided only if the used Activiti version is 8.7.0 or higher.
 */
export const TASK_SEARCH_API_METHOD_TOKEN = new InjectionToken<'GET' | 'POST'>('task-search-method');

/**
 * Token used to indicate the API used to search for processes.
 * 'POST' value should be provided only if the used Activiti version is 8.7.0 or higher.
 */
export const PROCESS_SEARCH_API_METHOD_TOKEN = new InjectionToken<'GET' | 'POST'>('process-search-method');
