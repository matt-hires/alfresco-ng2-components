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

 /* spellchecker: disable */
export class PermissionsEnum extends String {
    static CONTRIBUTOR: string = 'Contributor';
    static CONSUMER: string = 'Consumer';
    static COLLABORATOR: string = 'Collaborator';
    static MANAGER: string = 'Manager';
    static EDITOR: string = 'Editor';
    static COORDINATOR: string = 'Coordinator';
    static NOT_CONTRIBUTOR: string = '!Contributor';
    static NOT_CONSUMER: string = '!Consumer';
    static NOT_COLLABORATOR: string = '!Collaborator';
    static NOT_MANAGER: string = '!Manager';
    static NOT_EDITOR: string = '!Editor';
    static NOT_COORDINATOR: string = '!Coordinator';
}
