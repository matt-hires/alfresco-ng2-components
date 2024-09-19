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
import { FormCloudSpinnerService } from './form-cloud-spinner.service';
import { OverlayModule } from '@angular/cdk/overlay';
import { FormService, FormSpinnerEvent, NoopTranslateModule } from '@alfresco/adf-core';
import { Subject } from 'rxjs';
import { Component } from '@angular/core';
import { FormSpinnerComponent } from '../../components/spinner/form-spinner.component';
import { MatProgressSpinnerHarness } from '@angular/material/progress-spinner/testing';
import { PortalModule } from '@angular/cdk/portal';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';

@Component({
    standalone: true,
    selector: 'adf-cloud-overlay-test',
    template: `<div>adf-cloud-overlay-test</div>`
})
class SpinnerTestComponent {}

describe('FormCloudSpinnerService', () => {
    let fixture: ComponentFixture<SpinnerTestComponent>;
    let rootLoader: HarnessLoader;
    let spinnerService: FormCloudSpinnerService;
    let formService: FormService;

    const showSpinnerEvent = new FormSpinnerEvent('toggle-spinner', { showSpinner: true, message: 'LOAD_SPINNER_MESSAGE' });
    const hideSpinnerEvent = new FormSpinnerEvent('toggle-spinner', { showSpinner: false });

    const onDestroy$ = new Subject<boolean>();

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NoopTranslateModule, FormSpinnerComponent, SpinnerTestComponent, OverlayModule, PortalModule],
            providers: [
                {
                    provide: FormService,
                    useValue: {
                        toggleFormSpinner: new Subject()
                    }
                }
            ]
        });

        fixture = TestBed.createComponent(SpinnerTestComponent);
        rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
        spinnerService = TestBed.inject(FormCloudSpinnerService);
        formService = TestBed.inject(FormService);
    });

    it('should toggle spinner', async () => {
        spinnerService.initSpinnerHandling(onDestroy$);
        formService.toggleFormSpinner.next(showSpinnerEvent);
        fixture.detectChanges();

        let hasSpinner = await rootLoader.hasHarness(MatProgressSpinnerHarness);
        expect(hasSpinner).toBeTrue();

        formService.toggleFormSpinner.next(hideSpinnerEvent);
        fixture.detectChanges();

        hasSpinner = await rootLoader.hasHarness(MatProgressSpinnerHarness);
        expect(hasSpinner).toBeFalse();
    });
});
