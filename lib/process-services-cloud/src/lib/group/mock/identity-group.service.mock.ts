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

import { HttpErrorResponse } from '@angular/common/http';
import { IdentityGroupFilterInterface } from '../services/identity-group-filter.interface';

export const mockSearchGroupByRoles: IdentityGroupFilterInterface = {
    roles: ['fake-role-1', 'fake-role-2'],
    withinApplication: ''
};

export const mockSearchGroupByRolesAndApp: IdentityGroupFilterInterface = {
    roles: ['fake-role-1', 'fake-role-2'],
    withinApplication: 'fake-app-name'
};

export const mockSearchGroupByApp: IdentityGroupFilterInterface = {
    roles: [],
    withinApplication: 'fake-app-name'
};

export const mockHttpErrorResponse = new HttpErrorResponse({
    error: 'Mock Error',
    status: 404, statusText: 'Not Found'
});
