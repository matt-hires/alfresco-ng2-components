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

import { Component, ViewEncapsulation, ChangeDetectionStrategy, Input } from '@angular/core';
import { StatusData } from '../interfaces';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatTableModule } from '@angular/material/table';

@Component({
    selector: 'adf-about-status-list',
    templateUrl: './about-status-list.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, TranslateModule, MatTableModule]
})
export class AboutStatusListComponent {
    columns = [
        {
            columnDef: 'property',
            header: 'ABOUT.STATUS.PROPERTY',
            cell: (row: StatusData) => `${row.property}`
        },
        {
            columnDef: 'value',
            header: 'ABOUT.STATUS.VALUE',
            cell: (row: StatusData) => `${row.value}`
        }
    ];

    displayedColumns = this.columns.map((x) => x.columnDef);

    @Input()
    data: StatusData[] = [];
}
