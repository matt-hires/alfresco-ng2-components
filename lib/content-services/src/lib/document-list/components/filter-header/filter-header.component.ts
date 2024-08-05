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

import { Component, Inject, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { PaginationModel, DataSorting, HeaderFilterTemplateDirective } from '@alfresco/adf-core';
import { SearchHeaderQueryBuilderService } from '../../../search/services/search-header-query-builder.service';
import { FilterSearch } from './../../../search/models/filter-search.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ADF_DOCUMENT_PARENT_COMPONENT } from '../document-list.token';
import { CommonModule } from '@angular/common';
import { SearchFilterContainerComponent } from '../../../search/components/search-filter-container/search-filter-container.component';

@Component({
    selector: 'adf-filter-header',
    standalone: true,
    imports: [CommonModule, HeaderFilterTemplateDirective, SearchFilterContainerComponent],
    templateUrl: './filter-header.component.html'
})
export class FilterHeaderComponent implements OnInit, OnChanges, OnDestroy {
    /** (optional) Initial filter value to sort . */
    @Input()
    value: any = { /* empty */ };

    /** The id of the current folder of the document list. */
    @Input()
    currentFolderId: string;

    /** Emitted when a filter value is selected */
    @Output()
    filterSelection: EventEmitter<FilterSearch[]> = new EventEmitter();

    isFilterServiceActive: boolean;
    private onDestroy$ = new Subject<boolean>();

    constructor(@Inject(ADF_DOCUMENT_PARENT_COMPONENT) private documentList: any, private searchFilterQueryBuilder: SearchHeaderQueryBuilderService) {
        this.isFilterServiceActive = this.searchFilterQueryBuilder.isFilterServiceActive();
    }

    ngOnInit() {
        this.searchFilterQueryBuilder.executed.pipe(takeUntil(this.onDestroy$)).subscribe((newNodePaging) => {
            this.documentList.node = newNodePaging;
            this.documentList.reload();
        });

        this.initDataPagination();
        this.initDataSorting();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['currentFolderId']?.currentValue) {
            this.resetFilterHeader();
            this.configureSearchParent(changes['currentFolderId'].currentValue);
        }
    }

    onFilterSelectionChange() {
        this.filterSelection.emit(this.searchFilterQueryBuilder.getActiveFilters());
        if (this.searchFilterQueryBuilder.isNoFilterActive()) {
            this.documentList.node = null;
            this.documentList.reload();
        }
    }

    resetFilterHeader() {
        this.searchFilterQueryBuilder.resetActiveFilters();
    }

    initDataPagination() {
        this.documentList.pagination.pipe(takeUntil(this.onDestroy$)).subscribe((newPagination: PaginationModel) => {
            this.searchFilterQueryBuilder.setupCurrentPagination(newPagination.maxItems, newPagination.skipCount);
        });
    }

    initDataSorting() {
        this.documentList.sortingSubject.pipe(takeUntil(this.onDestroy$)).subscribe((sorting: DataSorting[]) => {
            this.searchFilterQueryBuilder.setSorting(sorting);
        });
    }

    private configureSearchParent(currentFolderId: string) {
        if (this.searchFilterQueryBuilder.isCustomSourceNode(currentFolderId)) {
            this.searchFilterQueryBuilder.getNodeIdForCustomSource(currentFolderId).subscribe((node) => {
                this.initSearchHeader(node.id);
            });
        } else {
            this.initSearchHeader(currentFolderId);
        }
    }

    private initSearchHeader(currentFolderId: string) {
        this.searchFilterQueryBuilder.setCurrentRootFolderId(currentFolderId);
        if (this.value) {
            Object.keys(this.value).forEach((columnKey) => {
                this.searchFilterQueryBuilder.setActiveFilter(columnKey, this.value[columnKey]);
            });
        }
    }

    ngOnDestroy() {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }
}
