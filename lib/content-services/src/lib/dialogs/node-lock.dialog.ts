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

import { Component, Inject, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { differenceInSeconds } from 'date-fns';
import { NodeBodyLock, Node, NodeEntry, NodesApi } from '@alfresco/js-api';
import { AlfrescoApiService } from '@alfresco/adf-core';

@Component({
    selector: 'adf-node-lock',
    templateUrl: './node-lock.dialog.html',
    encapsulation: ViewEncapsulation.None
})
export class NodeLockDialogComponent implements OnInit {
    form: UntypedFormGroup;
    node: Node = null;
    nodeName: string;

    private _nodesApi: NodesApi;
    get nodesApi(): NodesApi {
        this._nodesApi = this._nodesApi ?? new NodesApi(this.alfrescoApi.getInstance());
        return this._nodesApi;
    }

    constructor(
        private formBuilder: UntypedFormBuilder,
        public dialog: MatDialogRef<NodeLockDialogComponent>,
        private alfrescoApi: AlfrescoApiService,
        @Optional()
        @Inject(MAT_DIALOG_DATA)
        public data: any
    ) {}

    ngOnInit() {
        const { node } = this.data;
        this.nodeName = node.name;

        const isTimeLock = !!node.properties['cm:expiryDate'];
        const time = isTimeLock ? new Date(node.properties['cm:expiryDate']) : new Date();

        this.form = this.formBuilder.group({
            isLocked: node.isLocked || false,
            allowOwner: node.properties['cm:lockType'] === 'WRITE_LOCK',
            isTimeLock,
            time
        });
    }

    private get lockTimeInSeconds(): number {
        if (this.form.value.isTimeLock) {
            return differenceInSeconds(new Date(this.form.value.time), Date.now());
        }

        return 0;
    }

    private get nodeBodyLock(): NodeBodyLock {
        return {
            timeToExpire: this.lockTimeInSeconds,
            type: this.form.value.allowOwner ? 'ALLOW_OWNER_CHANGES' : 'FULL',
            lifetime: 'PERSISTENT'
        };
    }

    private toggleLock(): Promise<NodeEntry> {
        const {
            data: { node }
        } = this;

        if (this.form.value.isLocked) {
            return this.nodesApi.lockNode(node.id, this.nodeBodyLock);
        }

        return this.nodesApi.unlockNode(node.id);
    }

    submit(): void {
        this.toggleLock()
            .then((node: NodeEntry) => {
                this.data.node.isLocked = this.form.value.isLocked;
                this.dialog.close(node.entry);
            })
            .catch((error: any) => this.data.onError(error));
    }
}
