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

import { BaseApi } from './base.api';
import { throwIfNotDefined } from '../../../assert';
import { ContentPagingQuery, NodeChildAssociationPaging } from '../../content-rest-api';

/**
 * Legal Holds service.
 *
 * @module LegalHoldApi
 */
export class LegalHoldApi extends BaseApi {
    /**
     * List of legal holds
     *
     * @param filePlanId The identifier of a file plan. You can also use the -filePlan- alias.
     * @param opt Optional parameters
     * @returns Promise<NodeChildAssociationPaging>
     */
    getHolds(filePlanId: string = '-filePlan-', opts?: ContentPagingQuery): Promise<NodeChildAssociationPaging> {
        throwIfNotDefined(filePlanId, 'filePlanId');

        const pathParams = {
            filePlanId
        };

        const queryParams = {
            skipCount: opts?.skipCount,
            maxItems: opts?.maxItems
        };

        return this.get({
            path: '/file-plans/{filePlanId}/holds',
            pathParams,
            queryParams,
            returnType: NodeChildAssociationPaging
        });
    }

    /**
     * Adds to existiing hold
     *
     * @param holdId The identifier of a hold.
     * @param ids list of ids of holds to add to existing hold
     * @returns Promise<NodeChildAssociationPaging>
     */
    saveToExistingHolds(ids: string[], holdId: string): Promise<NodeChildAssociationPaging> {
        throwIfNotDefined(holdId, 'holdId');

        return this.post({
            path: '/holds/{holdId}/children',
            pathParams: { holdId },
            bodyParam: ids,
            returnType: NodeChildAssociationPaging
        });
    }
}
