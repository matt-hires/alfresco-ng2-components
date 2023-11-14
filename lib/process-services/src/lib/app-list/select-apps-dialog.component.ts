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

import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { AppsProcessService } from './services/apps-process.service';

@Component({
    selector: 'adf-select-apps-dialog',
    templateUrl: './select-apps-dialog.component.html',
    styleUrls: ['./select-apps-dialog.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class SelectAppsDialogComponent {

    processApps: any;

    selectedProcess: any;

    constructor(private appsProcessService: AppsProcessService,
                public dialogRef: MatDialogRef<SelectAppsDialogComponent>,
                @Inject(MAT_DIALOG_DATA) public data: any) {

        this.appsProcessService.getDeployedApplications().subscribe(
            (apps) => {
                this.processApps = apps.filter((currentApp) => currentApp.id);
            }
        );
    }

    onStart(): void {
        this.dialogRef.close(this.selectedProcess);
    }
}
