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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ObjectDataTableAdapter } from '../../data/object-datatable-adapter';
import { ObjectDataColumn } from '../../data/object-datacolumn.model';
import { CoreTestingModule } from '../../../testing/core.testing.module';
import { JsonCellComponent } from './json-cell.component';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { MatLegacyButtonHarness as MatButtonHarness } from '@angular/material/legacy-button/testing';

describe('JsonCellComponent', () => {
    let loader: HarnessLoader;
    let component: JsonCellComponent;
    let fixture: ComponentFixture<JsonCellComponent>;
    let dataTableAdapter: ObjectDataTableAdapter;
    let rowData: any;
    let columnData: any;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CoreTestingModule]
        });
        fixture = TestBed.createComponent(JsonCellComponent);
        component = fixture.componentInstance;
        loader = TestbedHarnessEnvironment.loader(fixture);
    });

    beforeEach(() => {
        rowData = {
            name: '1',
            entity: {
                name: 'test',
                description: 'this is a test',
                version: 1
            }
        };

        columnData = { format: '/somewhere', type: 'json', key: 'entity' };

        dataTableAdapter = new ObjectDataTableAdapter([rowData], [new ObjectDataColumn(columnData)]);

        component.column = dataTableAdapter.getColumns()[0];
        component.data = dataTableAdapter;
        component.row = dataTableAdapter.getRows()[0];
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should set value', () => {
        fixture.detectChanges();
        component.value$.subscribe((result) => {
            expect(result).toBe(rowData.entity);
        });
    });

    it('should render json button inside cell', async () => {
        fixture.detectChanges();

        const buttonExists = await loader.hasHarness(MatButtonHarness);
        expect(buttonExists).toBe(true);
    });

    it('should not setup cell when has no data', () => {
        rowData.entity = {};
        fixture.detectChanges();
        component.value$.subscribe((result) => {
            expect(result).toEqual({});
        });
    });
});
