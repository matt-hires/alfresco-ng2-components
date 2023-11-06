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

 /* eslint-disable @angular-eslint/component-selector */

import { Component, OnInit } from '@angular/core';
import { DiagramElement } from '../diagram-element';

@Component({
    selector: 'diagram-icon-user-task',
    templateUrl: './diagram-icon-user-task.component.html'
})
export class DiagramIconUserTaskComponent extends DiagramElement implements OnInit {
    position: any;

    options: any = {stroke: '', fillColors: '', fillOpacity: '', strokeWidth: ''};

    ngOnInit() {
        this.position = {x: this.data.x + 4, y: this.data.y + 4};
        this.options.stroke = 'none' ;
        this.options.fillColors = '#d1b575' ;
    }
}
