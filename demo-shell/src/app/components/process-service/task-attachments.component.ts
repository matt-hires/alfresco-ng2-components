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

import { Component, Input, OnChanges, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { TaskAttachmentListComponent, TaskListService, TaskUploadService } from '@alfresco/adf-process-services';
import { AlfrescoApiService, AppConfigService } from '@alfresco/adf-core';
import { DiscoveryApiService, UploadService } from '@alfresco/adf-content-services';
import { PreviewService } from '../../services/preview.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TaskRepresentation } from '@alfresco/js-api';

/**
 * Provide a task upload service factory
 *
 * @param api api client
 * @param config config service
 * @param discoveryApiService discovery service
 * @returns factory function
 */
export function taskUploadServiceFactory(api: AlfrescoApiService, config: AppConfigService, discoveryApiService: DiscoveryApiService) {
    return new TaskUploadService(api, config, discoveryApiService);
}

@Component({
    selector: 'app-task-attachments',
    templateUrl: './task-attachments.component.html',
    styleUrls: ['./task-attachments.component.css'],
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: UploadService,
            useFactory: taskUploadServiceFactory,
            deps: [AlfrescoApiService, AppConfigService, DiscoveryApiService]
        }
    ]
})
export class TaskAttachmentsComponent implements OnInit, OnChanges, OnDestroy {
    @ViewChild('taskAttachList')
    taskAttachList: TaskAttachmentListComponent;

    @Input()
    taskId: string;

    taskDetails: TaskRepresentation;

    private onDestroy$ = new Subject<boolean>();

    constructor(private uploadService: UploadService, private taskListService: TaskListService, private previewService: PreviewService) {}

    ngOnInit() {
        this.uploadService.fileUploadComplete.pipe(takeUntil(this.onDestroy$)).subscribe((event) => this.onFileUploadComplete(event.data));
    }

    ngOnChanges() {
        if (this.taskId) {
            this.taskListService.getTaskDetails(this.taskId).subscribe((taskDetails) => (this.taskDetails = taskDetails));
        }
    }

    ngOnDestroy() {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    onFileUploadComplete(content: any) {
        this.taskAttachList.add(content);
    }

    onAttachmentClick(content: any): void {
        this.previewService.showBlob(content.name, content.contentBlob);
    }

    isCompletedTask(): boolean {
        return this.taskDetails?.endDate != null;
    }
}
