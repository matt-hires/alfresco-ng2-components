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

/* eslint-disable @angular-eslint/component-selector */

import { Component } from '@angular/core';
import { DiagramElement } from '../diagram-element';
import { DiagramTaskComponent } from './diagram-task.component';
import { DiagramIconServiceTaskComponent } from '../icons/diagram-icon-service-task.component';

@Component({
    selector: 'diagram-service-task',
    standalone: true,
    imports: [DiagramTaskComponent, DiagramIconServiceTaskComponent],
    templateUrl: './diagram-service-task.component.html'
})
export class DiagramServiceTaskComponent extends DiagramElement {}
