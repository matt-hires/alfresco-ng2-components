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

import { BaseMock } from '../base.mock';
import nock from 'nock';

export class SearchAiMock extends BaseMock {
    mockGetAsk200Response(): void {
        nock(this.host, { encodedQueryParams: true })
            .get('/alfresco/api/-default-/private/hxi/versions/1/questions', [
                {
                    question: 'some question 1',
                    restrictionQuery: 'some node id 1'
                },
                {
                    question: 'some question 2',
                    restrictionQuery: 'some node id 2,some node id 3'
                }
            ])
            .reply(200, [
                {
                    question: 'some question 1',
                    questionId: 'some id 1',
                    restrictionQuery: 'some node id 1'
                },
                {
                    question: 'some question 2',
                    questionId: 'some id 2',
                    restrictionQuery: 'some node id 2,some node id 3'
                }
            ]);
    }

    mockGetAnswer200Response(): void {
        nock(this.host, { encodedQueryParams: true })
            .get('/alfresco/api/-default-/private/hxi/versions/1/answers/-default-?questionId=id1')
            .reply(200, {
                list: {
                    pagination: {
                        count: 2,
                        hasMoreItems: false,
                        skipCount: 0,
                        maxItems: 100
                    },
                    entries: [
                        {
                            entry: {
                                answer: 'Some answer 1',
                                questionId: 'some id 1',
                                references: [
                                    {
                                        referenceId: 'some reference id 1',
                                        referenceText: 'some reference text 1'
                                    }
                                ]
                            }
                        },
                        {
                            entry: {
                                answer: 'Some answer 2',
                                questionId: 'some id 2',
                                references: [
                                    {
                                        referenceId: 'some reference id 2',
                                        referenceText: 'some reference text 2'
                                    }
                                ]
                            }
                        }
                    ]
                }
            });
    }
}
