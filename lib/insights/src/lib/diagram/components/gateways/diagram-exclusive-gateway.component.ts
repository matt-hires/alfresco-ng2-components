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

import { Component, OnInit } from '@angular/core';
import { MAIN_STROKE_COLOR } from '../../constants/diagram-colors';
import { DiagramElement } from '../diagram-element';
import { DiagramGatewayComponent } from './diagram-gateway.component';
import { RaphaelCrossDirective } from '../raphael/raphael-cross.component';

@Component({
    selector: 'diagram-exclusive-gateway',
    standalone: true,
    imports: [DiagramGatewayComponent, RaphaelCrossDirective],
    templateUrl: './diagram-exclusive-gateway.component.html'
})
export class DiagramExclusiveGatewayComponent extends DiagramElement implements OnInit {
    center: any = { /* empty */ };
    width: any;
    height: any;
    options: any = { stroke: '', fillColors: '', fillOpacity: '', strokeWidth: 3 };

    ngOnInit() {
        this.center.x = this.data.x;
        this.center.y = this.data.y;
        this.width = this.data.width;
        this.height = this.data.height;

        this.options.stroke = this.diagramColorService.getBpmnColor(this.data, MAIN_STROKE_COLOR);
        this.options.fillColors = this.diagramColorService.getFillColour(this.data.id);
        this.options.fillOpacity = this.diagramColorService.getFillOpacity();
    }
}
