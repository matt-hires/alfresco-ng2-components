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

import { CoreTestingModule, UserInfoMode } from '@alfresco/adf-core';
import { fakeEcmUser, fakeEcmUserNoImage } from '@alfresco/adf-content-services';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatMenuModule } from '@angular/material/menu';
import { By } from '@angular/platform-browser';
import { BpmUserModel } from '../common/models/bpm-user.model';
import { ProcessUserInfoComponent } from './process-user-info.component';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTabGroupHarness, MatTabHarness } from '@angular/material/tabs/testing';

const fakeBpmUser = new BpmUserModel({
    apps: [],
    capabilities: null,
    company: 'fake-company',
    created: 'fake-create-date',
    email: 'fakeBpm@fake.com',
    externalId: 'fake-external-id',
    firstName: 'fake-bpm-first-name',
    lastName: 'fake-bpm-last-name',
    groups: [],
    id: 'fake-id',
    lastUpdate: 'fake-update-date',
    latestSyncTimeStamp: 'fake-timestamp',
    password: 'fake-password',
    pictureId: 12,
    status: 'fake-status',
    tenantId: 'fake-tenant-id',
    tenantName: 'fake-tenant-name',
    tenantPictureId: 'fake-tenant-picture-id',
    type: 'fake-type'
});

describe('ProcessUserInfoComponent', () => {
    const profilePictureUrl = 'alfresco-logo.svg';

    let component: ProcessUserInfoComponent;
    let fixture: ComponentFixture<ProcessUserInfoComponent>;
    let loader: HarnessLoader;
    let element: HTMLElement;

    const openUserInfo = () => {
        fixture.detectChanges();
        const imageButton = element.querySelector<HTMLButtonElement>('#logged-user-img');
        imageButton.click();
        fixture.detectChanges();
    };

    const whenFixtureReady = async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [CoreTestingModule, MatMenuModule]
        });
        fixture = TestBed.createComponent(ProcessUserInfoComponent);
        component = fixture.componentInstance;
        loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
        element = fixture.nativeElement;

        spyOn(window, 'requestAnimationFrame').and.returnValue(1);
    });

    afterEach(() => {
        fixture.destroy();
    });

    it('should not show any image if the user is not logged in', () => {
        expect(element.querySelector('#userinfo_container')).toBeDefined();
        expect(element.querySelector('#logged-user-img')).toBeNull();
    });

    it('should NOT have users immediately after ngOnInit', () => {
        expect(element.querySelector('#userinfo_container')).toBeDefined();
        expect(element.querySelector('#ecm_username')).toBeNull();
        expect(element.querySelector('#bpm_username')).toBeNull();
        expect(element.querySelector('#user-profile-lists')).toBeNull();
    });

    describe('when user is logged on bpm', () => {
        beforeEach(async () => {
            component.bpmUser = fakeBpmUser;
            component.isLoggedIn = true;
        });

        it('should show full name next the user image', async () => {
            await whenFixtureReady();
            openUserInfo();
            const bpmUserName = fixture.debugElement.query(By.css('#bpm-username'));
            expect(element.querySelector('#userinfo_container')).not.toBeNull();
            expect(bpmUserName).toBeDefined();
            expect(bpmUserName).not.toBeNull();
            expect(bpmUserName.nativeElement.innerHTML).toContain('fake-bpm-first-name fake-bpm-last-name');
        });

        it('should get the bpm current user image from the service', async () => {
            spyOn(component, 'getBpmUserImage').and.returnValue(profilePictureUrl);
            await whenFixtureReady();
            expect(element.querySelector('#userinfo_container')).not.toBeNull();
            expect(element.querySelector('#logged-user-img')).not.toBeNull();
            expect(element.querySelector('#logged-user-img').getAttribute('src')).toContain(profilePictureUrl);
        });

        it('should show last name if first name is null', async () => {
            const wrongBpmUser: BpmUserModel = new BpmUserModel({
                firstName: null,
                lastName: 'fake-last-name'
            });
            component.bpmUser = wrongBpmUser;
            await whenFixtureReady();
            const fullNameElement = element.querySelector('#adf-userinfo-bpm-name-display');
            fixture.detectChanges();
            expect(element.querySelector('#userinfo_container')).toBeDefined();
            expect(element.querySelector('#adf-userinfo-bpm-name-display')).not.toBeNull();
            expect(fullNameElement.textContent).toContain('fake-last-name');
            expect(fullNameElement.textContent).not.toContain('fake-first-name');
        });

        it('should not show the tabs', async () => {
            await whenFixtureReady();
            openUserInfo();
            const tabGroupHost = await (await loader.getHarness(MatTabGroupHarness.with({ selector: '#tab-group-env' }))).host();
            expect(await tabGroupHost.hasClass('adf-hide-tab')).toBeTruthy();
        });
    });

    describe('when user is logged on bpm and ecm', () => {
        beforeEach(async () => {
            component.bpmUser = fakeBpmUser;
            component.ecmUser = fakeEcmUser as any;
            component.isLoggedIn = true;
            component.mode = UserInfoMode.ALL;
        });

        it('should show the tabs', async () => {
            await whenFixtureReady();
            openUserInfo();
            const tabGroupHost = await (await loader.getHarness(MatTabGroupHarness.with({ selector: '#tab-group-env' }))).host();
            expect(await tabGroupHost.hasClass('adf-hide-tab')).toBeFalsy();
        });

        it('should get the bpm user information', async () => {
            spyOn(component, 'getBpmUserImage').and.returnValue(profilePictureUrl);
            await whenFixtureReady();
            openUserInfo();
            const bpmTab = await loader.getHarness(MatTabHarness.with({ label: 'USER_PROFILE.TAB.PS' }));
            await bpmTab.select();
            const bpmUsername = fixture.debugElement.query(By.css('#bpm-username'));
            const bpmImage = fixture.debugElement.query(By.css('#bpm-user-detail-image'));
            expect(element.querySelector('#userinfo_container')).not.toBeNull();
            expect(bpmUsername).not.toBeNull();
            expect(bpmImage).not.toBeNull();
            expect(bpmImage.properties.src).toContain(profilePictureUrl);
            expect(bpmUsername.nativeElement.textContent).toContain('fake-bpm-first-name fake-bpm-last-name');
            expect(fixture.debugElement.query(By.css('#bpm-tenant')).nativeElement.textContent).toContain('fake-tenant-name');
        });

        it('should get the ecm user information', async () => {
            spyOn(component, 'getEcmAvatar').and.returnValue(profilePictureUrl);
            await whenFixtureReady();
            openUserInfo();
            const ecmUsername = fixture.debugElement.query(By.css('#ecm-username'));
            const ecmImage = fixture.debugElement.query(By.css('#ecm-user-detail-image'));

            fixture.detectChanges();
            await fixture.whenStable();
            expect(element.querySelector('#userinfo_container')).toBeDefined();
            expect(ecmUsername).not.toBeNull();
            expect(ecmImage).not.toBeNull();
            expect(ecmImage.properties.src).toContain(profilePictureUrl);
            expect(fixture.debugElement.query(By.css('#ecm-full-name')).nativeElement.textContent).toContain(
                'fake-ecm-first-name fake-ecm-last-name'
            );
            expect(fixture.debugElement.query(By.css('#ecm-job-title')).nativeElement.textContent).toContain('job-ecm-test');
        });

        it('should show the ecm image if exists', async () => {
            spyOn(component, 'getEcmAvatar').and.returnValue(profilePictureUrl);
            await whenFixtureReady();
            openUserInfo();
            expect(element.querySelector('#userinfo_container')).toBeDefined();
            expect(element.querySelector('#logged-user-img')).toBeDefined();
            expect(element.querySelector('#logged-user-img').getAttribute('src')).toEqual(profilePictureUrl);
        });

        it('should show the ecm initials if the ecm user has no image', async () => {
            component.ecmUser = fakeEcmUserNoImage as any;
            await whenFixtureReady();

            expect(element.querySelector('#userinfo_container')).toBeDefined();
            expect(element.querySelector('[data-automation-id="user-initials-image"]').textContent).toContain('ff');
        });

        it('should show the tabs for the env', async () => {
            await whenFixtureReady();
            openUserInfo();
            const tabGroup = await loader.getHarness(MatTabGroupHarness.with({ selector: '#tab-group-env' }));
            const tabs = await tabGroup.getTabs();

            expect(await (await tabGroup.host()).hasClass('adf-hide-tab')).toBeFalsy();
            expect(tabs.length).toBe(2);
        });

        it('should not close the menu when a tab is clicked', async () => {
            await whenFixtureReady();
            openUserInfo();
            const bpmTab = await loader.getHarness(MatTabHarness.with({ label: 'USER_PROFILE.TAB.PS' }));

            bpmTab.select();
            expect(fixture.debugElement.query(By.css('#user-profile-lists'))).not.toBeNull();
        });
    });
});
