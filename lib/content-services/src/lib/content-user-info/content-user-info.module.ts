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

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContentUserInfoComponent } from './content-user-info.component';
import { TranslateModule } from '@ngx-translate/core';
import { FullNamePipe, InitialUsernamePipe, PipeModule } from '@alfresco/adf-core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

@NgModule({
    declarations: [ContentUserInfoComponent],
    imports: [
        CommonModule,
        MatButtonModule,
        MatMenuModule,
        MatTabsModule,
        MatCardModule,
        TranslateModule,
        PipeModule,
        InitialUsernamePipe,
        FullNamePipe
    ],
    exports: [ContentUserInfoComponent]
})
export class ContentUserInfoModule {}
