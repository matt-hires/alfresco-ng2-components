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

import { ElementFinder } from 'protractor';
import { BrowserActions } from '../../utils/browser-actions';

export class TogglePage {

    async enableToggle(toggle: ElementFinder): Promise<void> {
        const check = await BrowserActions.getAttribute(toggle, 'class');
        if (check.indexOf('mdc-switch--unselected') < 0) {
            await BrowserActions.click(toggle);
        }
    }

    async disableToggle(toggle: ElementFinder): Promise<void> {
        const check = await BrowserActions.getAttribute(toggle, 'class');
        if (check.indexOf('mat-mdc-slide-toggle-checked') >= 0) {
            await BrowserActions.click(toggle);
        }
    }
}
