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

import { AlfrescoApiService, AppConfigService } from '@alfresco/adf-core';
import { DiscoveryApiService, UploadService } from '@alfresco/adf-content-services';
import { ActivitiContentApi, RelatedContentRepresentation } from '@alfresco/js-api';
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ProcessUploadService extends UploadService {
    private _contentApi: ActivitiContentApi;
    get contentApi(): ActivitiContentApi {
        this._contentApi = this._contentApi ?? new ActivitiContentApi(this.apiService.getInstance());
        return this._contentApi;
    }

    constructor(protected apiService: AlfrescoApiService, appConfigService: AppConfigService, discoveryApiService: DiscoveryApiService) {
        super(apiService, appConfigService, discoveryApiService);
    }

    getUploadPromise(file: any): Promise<RelatedContentRepresentation> {
        const opts = {
            isRelatedContent: true
        };
        const processInstanceId = file.options.parentId;
        return this.contentApi.createRelatedContentOnProcessInstance(processInstanceId, file.file, opts);
    }
}
