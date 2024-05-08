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
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';

import { DecimalWidgetComponent } from './decimal.component';
import { FormService } from '../../../services/form.service';
import { FormFieldModel, FormFieldTypes, FormModel } from '../core';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { MatInputModule } from '@angular/material/input';
import { CoreTestingModule } from '../../../../testing';
import { FormsModule } from '@angular/forms';

describe('DecimalComponent', () => {
    let loader: HarnessLoader;
    let widget: DecimalWidgetComponent;
    let fixture: ComponentFixture<DecimalWidgetComponent>;
    let element: HTMLElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CoreTestingModule, MatInputModule, FormsModule],
            declarations: [DecimalWidgetComponent],
            providers: [FormService]
        }).compileComponents();

        fixture = TestBed.createComponent(DecimalWidgetComponent);
        widget = fixture.componentInstance;
        element = fixture.nativeElement;
        loader = TestbedHarnessEnvironment.loader(fixture);
    });

    describe('when tooltip is set', () => {
        beforeEach(() => {
            widget.field = new FormFieldModel(new FormModel({ taskId: '<id>' }), {
                type: FormFieldTypes.DECIMAL,
                tooltip: 'my custom tooltip'
            });
            fixture.detectChanges();
        });

        it('should show tooltip', async () => {
            const input = await loader.getHarness(MatInputHarness);
            await (await input.host()).hover();

            const tooltip = await loader.getHarness(MatTooltipHarness);
            expect(await tooltip.getTooltipText()).toBe('my custom tooltip');
        });

        it('should hide tooltip', async () => {
            const input = await loader.getHarness(MatInputHarness);
            await (await input.host()).hover();
            await (await input.host()).mouseAway();

            const tooltip = await loader.getHarness(MatTooltipHarness);
            expect(await tooltip.isOpen()).toBe(false);
        });
    });

    describe('when is required', () => {
        beforeEach(() => {
            widget.field = new FormFieldModel(new FormModel({ taskId: '<id>' }), {
                type: FormFieldTypes.DECIMAL,
                required: true
            });

            fixture.detectChanges();
        });

        it('should be marked as invalid after interaction', async () => {
            const input = await loader.getHarness(MatInputHarness);
            expect(fixture.nativeElement.querySelector('.adf-invalid')).toBeFalsy();

            const inputHost = await input.host();
            await inputHost.blur();
            fixture.detectChanges();

            const invalidElement = fixture.nativeElement.querySelector('.adf-invalid');

            expect(invalidElement).toBeTruthy();
        });

        it('should be able to display label with asterisk', async () => {
            const asterisk = element.querySelector('.adf-asterisk');

            expect(asterisk).toBeTruthy();
            expect(asterisk?.textContent).toEqual('*');
        });
    });

    describe('when form model has left labels', () => {
        it('should have left labels classes on leftLabels true', async () => {
            widget.field = new FormFieldModel(new FormModel({ taskId: 'fake-task-id', leftLabels: true }), {
                id: 'decimal-id',
                name: 'decimal-name',
                value: '',
                type: FormFieldTypes.DECIMAL,
                readOnly: false,
                required: true
            });

            fixture.detectChanges();
            await fixture.whenStable();

            const widgetContainer = element.querySelector('.adf-left-label-input-container');
            expect(widgetContainer).not.toBeNull();

            const adfLeftLabel = element.querySelector('.adf-left-label');
            expect(adfLeftLabel).not.toBeNull();
        });

        it('should not have left labels classes on leftLabels false', async () => {
            widget.field = new FormFieldModel(new FormModel({ taskId: 'fake-task-id', leftLabels: false }), {
                id: 'decimal-id',
                name: 'decimal-name',
                value: '',
                type: FormFieldTypes.DECIMAL,
                readOnly: false,
                required: true
            });

            fixture.detectChanges();
            await fixture.whenStable();

            const widgetContainer = element.querySelector('.adf-left-label-input-container');
            expect(widgetContainer).toBeNull();

            const adfLeftLabel = element.querySelector('.adf-left-label');
            expect(adfLeftLabel).toBeNull();
        });

        it('should not have left labels classes on leftLabels not present', async () => {
            widget.field = new FormFieldModel(new FormModel({ taskId: 'fake-task-id' }), {
                id: 'decimal-id',
                name: 'decimal-name',
                value: '',
                type: FormFieldTypes.DECIMAL,
                readOnly: false,
                required: true
            });

            fixture.detectChanges();
            await fixture.whenStable();

            const widgetContainer = element.querySelector('.adf-left-label-input-container');
            expect(widgetContainer).toBeNull();

            const adfLeftLabel = element.querySelector('.adf-left-label');
            expect(adfLeftLabel).toBeNull();
        });
    });
});
