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

import { FormFieldModel, FormFieldTypes, FormModel } from '@alfresco/adf-core';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PeopleCloudWidgetComponent } from './people-cloud.widget';
import { ProcessServiceCloudTestingModule } from '../../../../testing/process-service-cloud.testing.module';
import { IdentityUserService } from '../../../../people/services/identity-user.service';
import { mockShepherdsPie, mockYorkshirePudding } from '../../../../people/mock/people-cloud.mock';
import { By } from '@angular/platform-browser';

describe('PeopleCloudWidgetComponent', () => {
    let fixture: ComponentFixture<PeopleCloudWidgetComponent>;
    let widget: PeopleCloudWidgetComponent;
    let element: HTMLElement;
    let identityUserService: IdentityUserService;

    const setField = ({
        leftLabels = false,
        value = null,
        readOnly = false,
        required = false,
        selectLoggedUser = false,
        tooltip = ''
    }) => {
            widget.field = new FormFieldModel(new FormModel({ leftLabels }), {
                type: FormFieldTypes.PEOPLE,
                value,
                readOnly,
                required,
                selectLoggedUser,
                tooltip
            });
            fixture.detectChanges();
        };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                TranslateModule.forRoot(),
                ProcessServiceCloudTestingModule
            ],
            declarations: [
                PeopleCloudWidgetComponent
            ]
        });
        identityUserService = TestBed.inject(IdentityUserService);
        fixture = TestBed.createComponent(PeopleCloudWidgetComponent);
        widget = fixture.componentInstance;
        element = fixture.nativeElement;
        spyOn(identityUserService, 'getCurrentUserInfo').and.returnValue(mockShepherdsPie);
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should preselect the current user', () => {
        setField({ selectLoggedUser: true });

        expect(widget.preSelectUsers).toEqual([mockShepherdsPie]);
        expect(identityUserService.getCurrentUserInfo).toHaveBeenCalled();
    });

    it('should not preselect the current user if value exist', () => {
        setField({ selectLoggedUser: true, value: [mockYorkshirePudding] });

        expect(widget.preSelectUsers).toEqual([mockYorkshirePudding]);
        expect(identityUserService.getCurrentUserInfo).not.toHaveBeenCalled();
    });

    it('should have enabled validation if field is NOT readOnly', () => {
        setField({ readOnly: false });

        expect(widget.validate).toBeTruthy();
    });

    describe('when tooltip is set', () => {

        it('should show and hide tooltip', async () => {
            setField({ tooltip: 'my custom tooltip', value: [mockYorkshirePudding] });

            const cloudPeopleInput = element.querySelector('adf-cloud-people');
            cloudPeopleInput.dispatchEvent(new Event('mouseenter'));
            await fixture.whenStable();
            fixture.detectChanges();
            let tooltipElement = fixture.debugElement.query(By.css('.mat-tooltip')).nativeElement;

            expect(tooltipElement).toBeTruthy();
            expect(tooltipElement.textContent.trim()).toBe('my custom tooltip');

            cloudPeopleInput.dispatchEvent(new Event('mouseleave'));
            await fixture.whenStable();
            fixture.detectChanges();
            tooltipElement = fixture.debugElement.query(By.css('.mat-tooltip'));

            expect(tooltipElement).toBeFalsy();
          });
    });

    describe('when is required', () => {

        it('should be able to display label with asterisk', () => {
            setField({ required: true });

            const asterisk: HTMLElement = element.querySelector('.adf-asterisk');

            expect(asterisk).toBeTruthy();
            expect(asterisk.textContent).toEqual('*');
        });

        it('should be invalid after user interaction without typing', () => {
            setField({ required: true });

            expect(element.querySelector('.adf-invalid')).toBeFalsy();

            const cloudPeopleInput = element.querySelector('[data-automation-id="adf-people-cloud-search-input"]');
            cloudPeopleInput.dispatchEvent(new Event('blur'));

            fixture.detectChanges();

            expect(element.querySelector('.adf-invalid')).toBeTruthy();
        });

        it('should be invalid after deselecting all people', async () => {
            setField({ required: true, value: [mockYorkshirePudding] });
            await fixture.whenStable();

            expect(element.querySelector('.adf-error-text')).toBeFalsy();

            const removeGroupIcon = element.querySelector(
                '[data-automation-id="adf-people-cloud-chip-remove-icon-Yorkshire Pudding"]'
            );
            removeGroupIcon.dispatchEvent(new Event('click'));

            fixture.detectChanges();
            await fixture.whenStable();

            expect(element.querySelector('.adf-error-text')).toBeTruthy();
            expect(element.querySelector('.adf-error-text').textContent).toContain('ADF_CLOUD_USERS.ERROR.NOT_FOUND');
        });
    });

    describe('when is readOnly', () => {

        it('should single chip be disabled', async () => {
            setField({ readOnly: true, value: [mockYorkshirePudding] });
            await fixture.whenStable();

            const disabledFormField: HTMLElement = element.querySelector('.mat-form-field-disabled');
            expect(disabledFormField).toBeTruthy();

            fixture.detectChanges();
            await fixture.whenStable();

            const disabledPeopleChip: HTMLElement = element.querySelector('.mat-chip-disabled');
            expect(disabledPeopleChip).toBeTruthy();
        });

        it('should multi chips be disabled', async () => {
            setField({ readOnly: true, value: [mockYorkshirePudding, mockShepherdsPie]});
            await fixture.whenStable();

            const disabledFormField: HTMLElement = element.querySelector('.mat-form-field-disabled');
            expect(disabledFormField).toBeTruthy();

            fixture.detectChanges();
            await fixture.whenStable();

            const disabledPeopleChips = element.querySelectorAll('.mat-chip-disabled');
            expect(disabledPeopleChips.item(0)).toBeTruthy();
            expect(disabledPeopleChips.item(1)).toBeTruthy();
        });

        it('should have disabled validation', () => {
            setField({ readOnly: true, value: [] });

            expect(widget.validate).toBeFalsy();
        });
    });

    describe('when form model has left labels', () => {

        it('should have left labels classes on leftLabels true', async () => {
            setField({leftLabels: true});
            await fixture.whenStable();

            const widgetContainer = element.querySelector('.adf-left-label-input-container');
            expect(widgetContainer).not.toBeNull();

            const adfLeftLabel = element.querySelector('.adf-left-label');
            expect(adfLeftLabel).not.toBeNull();
        });

        it('should not have left labels classes on leftLabels false', async () => {
            setField({leftLabels: false});
            await fixture.whenStable();

            const widgetContainer = element.querySelector('.adf-left-label-input-container');
            expect(widgetContainer).toBeNull();

            const adfLeftLabel = element.querySelector('.adf-left-label');
            expect(adfLeftLabel).toBeNull();
        });

        it('should not have left labels classes on leftLabels not present', async () => {
            setField({});
            await fixture.whenStable();

            const widgetContainer = element.querySelector('.adf-left-label-input-container');
            expect(widgetContainer).toBeNull();

            const adfLeftLabel = element.querySelector('.adf-left-label');
            expect(adfLeftLabel).toBeNull();
        });
    });
});
