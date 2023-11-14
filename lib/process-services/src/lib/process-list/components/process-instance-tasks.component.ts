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

import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild, OnDestroy } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { Observable, Observer, Subject } from 'rxjs';
import { TaskDetailsEvent } from '../../task-list';
import { ProcessService } from './../services/process.service';
import { share, takeUntil } from 'rxjs/operators';
import { ProcessInstanceRepresentation, TaskRepresentation } from '@alfresco/js-api';

@Component({
    selector: 'adf-process-instance-tasks',
    templateUrl: './process-instance-tasks.component.html',
    styleUrls: ['./process-instance-tasks.component.css']
})
export class ProcessInstanceTasksComponent implements OnInit, OnChanges, OnDestroy {
    /** The ID of the process instance to display tasks for. */
    @Input()
    processInstanceDetails: ProcessInstanceRepresentation;

    /**
     * Toggles whether to show a refresh button next to the list of tasks to allow
     * it to be updated from the server.
     */
    @Input()
    showRefreshButton: boolean = true;

    /** Emitted when an error occurs. */
    @Output()
    error = new EventEmitter<any>();

    @ViewChild('startDialog')
    startDialog: any;

    @ViewChild('taskDetails')
    taskDetails: any;

    /** Emitted when a task is clicked. */
    @Output()
    taskClick = new EventEmitter<TaskDetailsEvent>();

    activeTasks: TaskRepresentation[] = [];
    completedTasks: TaskRepresentation[] = [];
    task$: Observable<TaskRepresentation>;
    completedTask$: Observable<TaskRepresentation>;
    message: string;
    processId: string;

    private taskObserver: Observer<TaskRepresentation>;
    private completedTaskObserver: Observer<TaskRepresentation>;
    private onDestroy$ = new Subject<boolean>();

    constructor(private processService: ProcessService, private dialog: MatDialog) {
        this.task$ = new Observable<TaskRepresentation>((observer) => (this.taskObserver = observer)).pipe(share());
        this.completedTask$ = new Observable<TaskRepresentation>((observer) => (this.completedTaskObserver = observer)).pipe(share());
    }

    ngOnInit() {
        this.task$.pipe(takeUntil(this.onDestroy$)).subscribe((task) => this.activeTasks.push(task));

        this.completedTask$.pipe(takeUntil(this.onDestroy$)).subscribe((task) => this.completedTasks.push(task));
    }

    ngOnDestroy() {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    ngOnChanges(changes: SimpleChanges) {
        const processInstanceDetails = changes['processInstanceDetails'];
        if (processInstanceDetails?.currentValue) {
            this.load(processInstanceDetails.currentValue.id);
        }
    }

    load(processInstanceId: string) {
        this.loadActive(processInstanceId);
        this.loadCompleted(processInstanceId);
    }

    loadActive(processInstanceId: string) {
        this.activeTasks = [];
        if (processInstanceId) {
            this.processService.getProcessTasks(processInstanceId, null).subscribe(
                (res) => {
                    res.forEach((task) => {
                        this.taskObserver.next(task);
                    });
                },
                (err) => {
                    this.error.emit(err);
                }
            );
        } else {
            this.activeTasks = [];
        }
    }

    loadCompleted(processInstanceId: string) {
        this.completedTasks = [];
        if (processInstanceId) {
            this.processService.getProcessTasks(processInstanceId, 'completed').subscribe(
                (res) => {
                    res.forEach((task) => {
                        this.completedTaskObserver.next(task);
                    });
                },
                (err) => {
                    this.error.emit(err);
                }
            );
        } else {
            this.completedTasks = [];
        }
    }

    hasStartFormDefined(): boolean {
        return this.processInstanceDetails?.startFormDefined === true;
    }

    getUserFullName(user: any): string {
        if (user) {
            return (user.firstName && user.firstName !== 'null' ? user.firstName + ' ' : '') + user.lastName;
        }
        return 'Nobody';
    }

    getFormatDate(value: any, format: string): any {
        const datePipe = new DatePipe('en-US');
        try {
            return datePipe.transform(value, format);
        } catch {
            return value;
        }
    }

    clickTask(task: TaskRepresentation) {
        const args = new TaskDetailsEvent(task);
        this.taskClick.emit(args);
    }

    clickStartTask() {
        this.processId = this.processInstanceDetails.id;
        this.showStartDialog();
    }

    showStartDialog() {
        this.dialog.open(this.startDialog, { height: '500px', width: '700px' });
    }

    closeStartDialog() {
        this.dialog.closeAll();
    }

    onRefreshClicked() {
        this.load(this.processInstanceDetails.id);
    }

    onFormContentClick() {
        this.closeStartDialog();
    }
}
