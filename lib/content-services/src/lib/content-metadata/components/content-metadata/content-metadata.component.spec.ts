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

import { ComponentFixture, discardPeriodicTasks, fakeAsync, flush, TestBed, tick } from '@angular/core/testing';
import { DebugElement, SimpleChange } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Category, CategoryPaging, ClassesApi, Node, Tag, TagBody, TagEntry, TagPaging, TagPagingList } from '@alfresco/js-api';
import { ContentMetadataComponent } from './content-metadata.component';
import { ContentMetadataService } from '../../services/content-metadata.service';
import { AppConfigService, CardViewBaseItemModel, CardViewComponent, LogService, UpdateNotification } from '@alfresco/adf-core';
import { NodesApiService } from '../../../common/services/nodes-api.service';
import { EMPTY, of, throwError } from 'rxjs';
import { ContentTestingModule } from '../../../testing/content.testing.module';
import { mockGroupProperties } from './mock-data';
import { TranslateModule } from '@ngx-translate/core';
import { CardViewContentUpdateService } from '../../../common/services/card-view-content-update.service';
import { PropertyGroup } from '../../interfaces/property-group.interface';
import { PropertyDescriptorsService } from '../../services/property-descriptors.service';
import {
    CardViewGroup,
    CategoriesManagementComponent,
    CategoriesManagementMode,
    CategoryService,
    TagsCreatorComponent,
    TagsCreatorMode,
    TagService
} from '@alfresco/adf-content-services';
import { ButtonType } from './button-type.enum';

describe('ContentMetadataComponent', () => {
    let component: ContentMetadataComponent;
    let fixture: ComponentFixture<ContentMetadataComponent>;
    let contentMetadataService: ContentMetadataService;
    let updateService: CardViewContentUpdateService;
    let nodesApiService: NodesApiService;
    let node: Node;
    let folderNode: Node;
    let tagService: TagService;
    let categoryService: CategoryService;
    let getClassSpy: jasmine.Spy;

    const preset = 'custom-preset';

    const mockTagPaging = (): TagPaging => {
        const tagPaging = new TagPaging();
        tagPaging.list = new TagPagingList();
        const tagEntry1 = new TagEntry();
        tagEntry1.entry = new Tag();
        tagEntry1.entry.tag = 'Tag 1';
        tagEntry1.entry.id = 'some id 1';
        const tagEntry2 = new TagEntry();
        tagEntry2.entry = new Tag();
        tagEntry2.entry.tag = 'Tag 2';
        tagEntry2.entry.id = 'some id 2';
        tagPaging.list.entries = [tagEntry1, tagEntry2];
        return tagPaging;
    };

    const category1 = new Category({ id: 'test', name: 'testCat' });
    const category2 = new Category({ id: 'test2', name: 'testCat2' });
    const categoryPagingResponse: CategoryPaging = { list: { pagination: {}, entries: [{ entry: category1 }, { entry: category2 }] } };

    const findTagElements = (): DebugElement[] => fixture.debugElement.queryAll(By.css('.adf-metadata-properties .adf-metadata-properties-tag'));

    const findCancelButton = (): HTMLButtonElement => fixture.debugElement.query(By.css('[data-automation-id=reset-metadata]')).nativeElement;
    const findCancelTagsButton = (): HTMLButtonElement => fixture.debugElement.query(By.css('[data-automation-id=reset-tags-metadata]')).nativeElement;

    const clickOnCancel = () => {
        findCancelButton().click();
        fixture.detectChanges();
    };

    const findSaveGeneralInfoButton = (): HTMLButtonElement => fixture.debugElement.query(By.css('[data-automation-id=save-general-info-metadata]')).nativeElement;
    const findSaveTagsButton = (): HTMLButtonElement => fixture.debugElement.query(By.css('[data-automation-id=save-tags-metadata]')).nativeElement;
    const findSaveCategoriesButton = (): HTMLButtonElement => fixture.debugElement.query(By.css('[data-automation-id=save-categories-metadata]')).nativeElement;

    const clickOnGeneralInfoSave = () => {
        findSaveGeneralInfoButton().click();
        fixture.detectChanges();
    };

    const clickOnTagsSave = () => {
        findSaveTagsButton().click();
        fixture.detectChanges();
    };

    const findTagsCreator = (): TagsCreatorComponent => fixture.debugElement.query(By.directive(TagsCreatorComponent))?.componentInstance;

    const findShowingTagInputButton = (): HTMLButtonElement => fixture.debugElement.query(By.css('.adf-tags-buttons')).nativeElement;

    /**
     * Get metadata categories
     *
     * @returns list of native elements
     */
    function getCategories(): HTMLParagraphElement[] {
        return fixture.debugElement.queryAll(By.css('.adf-metadata-categories'))?.map((debugElem) => debugElem.nativeElement);
    }

    /**
     * Get a categories management component
     *
     * @returns angular component
     */
    function getCategoriesManagementComponent(): CategoriesManagementComponent {
        return fixture.debugElement.query(By.directive(CategoriesManagementComponent))?.componentInstance;
    }

    /**
     * Get categories title button
     *
     * @returns native element
     */
    function getAssignCategoriesBtn(): HTMLButtonElement {
        return fixture.debugElement.query(By.css('.adf-metadata-categories-title')).nativeElement;
    }

    /**
     * Update aspect property
     *
     * @param newValue value to set
     */
    async function updateAspectProperty(newValue: string): Promise<void> {
        component.editable = true;
        const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
        const expectedNode = { ...node, name: 'some-modified-value' };
        spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));

        updateService.update(property, newValue);
        tick(600);

        fixture.detectChanges();
        await fixture.whenStable();
        const event = new MouseEvent('click');
        component.saveChanges(ButtonType.Group, event);
        await fixture.whenStable();
    }

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [TranslateModule.forRoot(), ContentTestingModule],
            providers: [
                {
                    provide: LogService,
                    useValue: {
                        error: jasmine.createSpy('error')
                    }
                },
                {
                    provide: TagService,
                    useValue: {
                        getTagsByNodeId: () => EMPTY,
                        removeTag: () => EMPTY,
                        assignTagsToNode: () => EMPTY
                    }
                },
                {
                    provide: CategoryService,
                    useValue: {
                        getCategoryLinksForNode: () => EMPTY,
                        linkNodeToCategory: () => EMPTY,
                        unlinkNodeFromCategory: () => EMPTY
                    }
                }
            ]
        });
        fixture = TestBed.createComponent(ContentMetadataComponent);
        component = fixture.componentInstance;
        contentMetadataService = TestBed.inject(ContentMetadataService);
        updateService = TestBed.inject(CardViewContentUpdateService);
        nodesApiService = TestBed.inject(NodesApiService);
        tagService = TestBed.inject(TagService);
        categoryService = TestBed.inject(CategoryService);
        const propertyDescriptorsService = TestBed.inject(PropertyDescriptorsService);
        const classesApi = propertyDescriptorsService['classesApi'];

        node = {
            id: 'node-id',
            aspectNames: [],
            nodeType: 'cm:node',
            content: {},
            properties: {},
            createdByUser: {},
            modifiedByUser: {}
        } as Node;

        folderNode = {
            id: 'folder-id',
            aspectNames: [],
            nodeType: '',
            createdByUser: {},
            modifiedByUser: {}
        } as Node;

        component.node = node;
        component.preset = preset;
        spyOn(contentMetadataService, 'getContentTypeProperty').and.returnValue(of([]));
        getClassSpy = spyOn(classesApi, 'getClass');
        fixture.detectChanges();
    });

    afterEach(() => {
        fixture.destroy();
    });

    describe('Default input param values', () => {
        it('should have editable input param as false by default', () => {
            expect(component.editable).toBe(false);
        });

        it('should have displayEmpty input param as false by default', () => {
            expect(component.displayEmpty).toBe(false);
        });

        it('should have expanded input param as false by default', () => {
            expect(component.expanded).toBe(false);
        });
    });

    describe('Folder', () => {
        it('should show the folder node', (done) => {
            component.expanded = false;
            fixture.detectChanges();

            component.basicProperties$.subscribe(() => {
                fixture.detectChanges();
                const basicPropertiesComponent = fixture.debugElement.query(By.directive(CardViewComponent)).componentInstance;
                expect(basicPropertiesComponent.properties).toBeDefined();
                done();
            });

            component.ngOnChanges({ node: new SimpleChange(node, folderNode, false) });
        });
    });

    describe('Saving', () => {
        it('itemUpdate', fakeAsync(() => {
            spyOn(component, 'updateChanges').and.callThrough();
            const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
            updateService.update(property, 'updated-value');

            tick(600);
            expect(component.hasMetadataChanged).toEqual(true);
            expect(component.updateChanges).toHaveBeenCalled();
            expect(component.changedProperties).toEqual({ properties: { 'property-key': 'updated-value' } });
        }));

        it('nodeAspectUpdate', fakeAsync(() => {
            const fakeNode = { id: 'fake-minimal-node', aspectNames: ['ft:a', 'ft:b', 'ft:c'], name: 'fake-node' } as Node;
            spyOn(contentMetadataService, 'getGroupedProperties').and.stub();
            spyOn(contentMetadataService, 'getBasicProperties').and.stub();
            updateService.updateNodeAspect(fakeNode);

            tick(600);
            expect(contentMetadataService.getBasicProperties).toHaveBeenCalled();
            expect(contentMetadataService.getGroupedProperties).toHaveBeenCalled();
        }));

        it('should save changedProperties on save click', fakeAsync(async () => {
            const expectedNode = { ...node, name: 'some-modified-value' };
            await updateAspectProperty('updated-value');
            expect(component.node).toEqual(expectedNode);
            expect(nodesApiService.updateNode).toHaveBeenCalled();
        }));

        it('should save changedProperties which delete property and update node on save click', fakeAsync(async () => {
            const expectedNode = { ...node, name: 'some-modified-value' };
            await updateAspectProperty('');
            expect(component.node).toEqual({ ...expectedNode, properties: {} });
            expect(nodesApiService.updateNode).toHaveBeenCalled();
        }));

        it('should call removeTag and assignTagsToNode on TagService on save click', fakeAsync(() => {
            component.editableTags = true;
            component.displayTags = true;
            const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
            const expectedNode = { ...node, name: 'some-modified-value' };
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));
            const tagPaging = mockTagPaging();
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            spyOn(tagService, 'removeTag').and.returnValue(EMPTY);
            spyOn(tagService, 'assignTagsToNode').and.returnValue(EMPTY);
            const tagName1 = tagPaging.list.entries[0].entry.tag;
            const tagName2 = 'New tag 3';
            updateService.update(property, 'updated-value');
            fixture.detectChanges();
            findTagsCreator().tagsChange.emit([tagName1, tagName2]);
            fixture.detectChanges();
            tick(600);
            clickOnTagsSave();
            tick(100);
            const tag1 = new TagBody();
            tag1.tag = tagName1;
            const tag2 = new TagBody();
            tag2.tag = tagName2;
            expect(tagService.removeTag).toHaveBeenCalledWith(node.id, tagPaging.list.entries[1].entry.id);
            expect(tagService.assignTagsToNode).toHaveBeenCalledWith(node.id, [tag1, tag2]);
          }));

        it('should call getTagsByNodeId on TagService on save click', () => {
            component.editableTags = true;
            component.displayTags = true;
            const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
            const expectedNode = { ...node, name: 'some-modified-value' };
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));
            const tagPaging = mockTagPaging();
            const getTagsByNodeIdSpy = spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            spyOn(tagService, 'removeTag').and.returnValue(of(undefined));
            spyOn(tagService, 'assignTagsToNode').and.returnValue(of({}));

            updateService.update(property, 'updated-value');

            fixture.detectChanges();
            findTagsCreator().tagsChange.emit([tagPaging.list.entries[0].entry.tag, 'New tag 3']);
            getTagsByNodeIdSpy.calls.reset();
            const mockEvent = new MouseEvent('click');
            component.saveChanges(ButtonType.Tags, mockEvent);

            expect(tagService.getTagsByNodeId).toHaveBeenCalledWith(node.id);
        });

        it('should throw error on unsuccessful save', fakeAsync(() => {
            const logService: LogService = TestBed.inject(LogService);
            component.editable = true;
            const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
            updateService.update(property, 'updated-value');
            tick(600);

            const sub = contentMetadataService.error.subscribe((err) => {
                expect(logService.error).toHaveBeenCalledWith(new Error('My bad'));
                expect(err.statusCode).toBe(0);
                expect(err.message).toBe('METADATA.ERRORS.GENERIC');
                sub.unsubscribe();
            });

            spyOn(nodesApiService, 'updateNode').and.returnValue(throwError(new Error('My bad')));

            fixture.detectChanges();
            fixture.whenStable().then(() => clickOnGeneralInfoSave());
            discardPeriodicTasks();
            flush();
        }));

        it('should open the confirm dialog when content type is changed', fakeAsync(() => {
            component.editable = true;
            const property = { key: 'nodeType', value: 'ft:sbiruli' } as CardViewBaseItemModel;
            const expectedNode = { ...node, nodeType: 'ft:sbiruli' };
            spyOn(contentMetadataService, 'openConfirmDialog').and.returnValue(of(true));
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));

            updateService.update(property, 'ft:poppoli');
            tick(600);

            fixture.detectChanges();
            tick(100);
            clickOnGeneralInfoSave();

            tick(100);
            expect(component.node).toEqual(expectedNode);
            expect(contentMetadataService.openConfirmDialog).toHaveBeenCalledWith({ nodeType: 'ft:poppoli' });
            expect(nodesApiService.updateNode).toHaveBeenCalled();
            discardPeriodicTasks();
        }));

        it('should call removeTag and assignTagsToNode on TagService after confirming confirmation dialog when content type is changed', fakeAsync(() => {
            component.editableTags = true;
            component.displayTags = true;
            const property = { key: 'nodeType', value: 'ft:sbiruli' } as CardViewBaseItemModel;
            const expectedNode = { ...node, nodeType: 'ft:sbiruli' };
            spyOn(contentMetadataService, 'openConfirmDialog').and.returnValue(of(true));
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));
            const tagPaging = mockTagPaging();
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            spyOn(tagService, 'removeTag').and.returnValue(EMPTY);
            spyOn(tagService, 'assignTagsToNode').and.returnValue(EMPTY);
            const tagName1 = tagPaging.list.entries[0].entry.tag;
            const tagName2 = 'New tag 3';

            updateService.update(property, 'ft:poppoli');
            tick(600);

            fixture.detectChanges();
            findTagsCreator().tagsChange.emit([tagName1, tagName2]);
            tick(100);
            fixture.detectChanges();
            clickOnTagsSave();

            tick(100);
            const tag1 = new TagBody();
            tag1.tag = tagName1;
            const tag2 = new TagBody();
            tag2.tag = tagName2;
            expect(tagService.removeTag).toHaveBeenCalledWith(node.id, tagPaging.list.entries[1].entry.id);
            expect(tagService.assignTagsToNode).toHaveBeenCalledWith(node.id, [tag1, tag2]);
        }));

        it('should retrigger the load of the properties when the content type has changed', fakeAsync(() => {
            component.editable = true;
            const property = { key: 'nodeType', value: 'ft:sbiruli' } as CardViewBaseItemModel;
            const expectedNode = Object.assign({}, node, { nodeType: 'ft:sbiruli' });
            spyOn(contentMetadataService, 'openConfirmDialog').and.returnValue(of(true));
            spyOn(updateService, 'updateNodeAspect');
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));

            updateService.update(property, 'ft:poppoli');
            tick(600);

            fixture.detectChanges();
            tick(100);
            clickOnGeneralInfoSave();

            tick(100);
            expect(component.node).toEqual(expectedNode);
            expect(updateService.updateNodeAspect).toHaveBeenCalledWith(expectedNode);
        }));
    });

    describe('editable', () => {
        it('should toggle general editable', () => {
            const eventMock = new MouseEvent('click');
            component.editable = false;
            component.toggleGeneralEdit(eventMock);
            expect(component.editable).toBe(true);
            expect(component.editableTags).toBe(false);
            expect(component.editableCategories).toBe(false);
        });

        it('should toggle tags editable', () => {
            const eventMock = new MouseEvent('click');
            component.editableTags = false;
            component.toggleTagsEdit(eventMock);
            expect(component.editableTags).toBe(true);
            expect(component.tagNameControlVisible).toBe(true);
            expect(component.tagsPanelState).toBe(true);
            expect(component.editable).toBe(false);
            expect(component.editableCategories).toBe(false);
        });

        it('should toggle categories editable', () => {
            const eventMock = new MouseEvent('click');
            component.editableCategories = false;
            component.toggleCategoriesEdit(eventMock);
            expect(component.editableCategories).toBe(true);
            expect(component.categoryControlVisible).toBe(true);
            expect(component.categoriesPanelState).toBe(true);
            expect(component.editable).toBe(false);
            expect(component.editableTags).toBe(false);
          });

          it('should toggle group editable', () => {
            const eventMock = new MouseEvent('click');
            const group: CardViewGroup = {
                editable: false, expanded: false,
                title: '',
                properties: []
            };
            component.editableGroup = null;
            component.toggleEdit(eventMock, group);
            expect(group.editable).toBe(true);
            expect(group.expanded).toBe(true);
            expect(component.editableGroup).toBe(group);
            expect(component.editable).toBe(false);
            expect(component.editableTags).toBe(false);
            expect(component.editableCategories).toBe(false);
          });
    });

    describe('toggleEditMode', () => {
        it('should toggle general editable', () => {
            component.editable = false;
            component.toggleEditMode(ButtonType.GeneralInfo);
            expect(component.editable).toBe(true);
          });

        it('should toggle tags editable', () => {
            component.editableTags = false;
            component.toggleEditMode(ButtonType.Tags);
            expect(component.editableTags).toBe(true);
        });

        it('should toggle categories editable', () => {
            component.editableCategories = false;
            component.toggleEditMode(ButtonType.Categories);
            expect(component.editableCategories).toBe(true);
        });

        it('should toggle group editable', () => {
            const group: CardViewGroup = {
                editable: false, expanded: false,
                title: '',
                properties: []
            };
            component.editableGroup = null;
            component.toggleEditMode(ButtonType.Group, group);
            expect(group.editable).toBe(true);
        });
    });

    describe('Reseting', () => {
        it('should reset properties on reset click', async () => {
            component.changedProperties = { properties: { 'property-key': 'updated-value' } };
            component.hasMetadataChanged = true;
            component.tagNameControlVisible = true;
            component.categoryControlVisible = true;
            component.editable = true;
            const expectedNode = Object.assign({}, node, { name: 'some-modified-value' });
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));

            fixture.detectChanges();
            await fixture.whenStable();
            const resetButton = fixture.debugElement.query(By.css('[data-automation-id="reset-metadata"]'));
            resetButton.nativeElement.click();

            fixture.detectChanges();
            expect(component.changedProperties).toEqual({});
            expect(nodesApiService.updateNode).not.toHaveBeenCalled();
            expect(component.hasMetadataChanged).toBeFalse();
            expect(component.tagNameControlVisible).toBeFalse();
            expect(component.categoryControlVisible).toBeFalse();
        });
    });

    describe('Properties loading', () => {
        let expectedNode: Node;

        beforeEach(() => {
            expectedNode = { ...node, name: 'some-modified-value' };
            fixture.detectChanges();
        });

        it('should load the basic properties on node change', () => {
            spyOn(contentMetadataService, 'getBasicProperties');

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            expect(contentMetadataService.getContentTypeProperty).toHaveBeenCalledWith(expectedNode);
            expect(contentMetadataService.getBasicProperties).toHaveBeenCalledWith(expectedNode);
        });

        it('should pass through the loaded basic properties to the card view', async () => {
            const expectedProperties = [];
            component.expanded = false;

            spyOn(contentMetadataService, 'getBasicProperties').and.returnValue(of(expectedProperties));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            fixture.detectChanges();
            await fixture.whenStable();

            const basicPropertiesComponent = fixture.debugElement.query(By.directive(CardViewComponent)).componentInstance;
            expect(basicPropertiesComponent.properties.length).toBe(expectedProperties.length);
        });

        it('should pass through the displayEmpty to the card view of basic properties', async () => {
            component.displayEmpty = false;

            fixture.detectChanges();
            await fixture.whenStable();

            spyOn(contentMetadataService, 'getBasicProperties').and.returnValue(of([]));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            fixture.detectChanges();
            await fixture.whenStable();

            const basicPropertiesComponent = fixture.debugElement.query(By.directive(CardViewComponent)).componentInstance;
            expect(basicPropertiesComponent.displayEmpty).toBe(false);
        });

        it('should load the group properties on node change', () => {
            spyOn(contentMetadataService, 'getGroupedProperties');

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            expect(contentMetadataService.getGroupedProperties).toHaveBeenCalledWith(expectedNode, 'custom-preset');
        });

        it('should load the group properties when preset config is provided on node change', () => {
            const presetConfig = [
                {
                    title: 'My custom preset',
                    items: [
                        {
                            type: 'my:type',
                            properties: '*'
                        },
                        {
                            aspect: 'my:aspect',
                            properties: '*'
                        }
                    ]
                }
            ];
            component.preset = presetConfig;
            spyOn(contentMetadataService, 'getGroupedProperties');

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            expect(contentMetadataService.getGroupedProperties).toHaveBeenCalledWith(expectedNode, presetConfig);
        });

        it('should pass through the loaded group properties to the card view', async () => {
            const expectedProperties = [];
            component.expanded = true;

            spyOn(contentMetadataService, 'getGroupedProperties').and.returnValue(of([{ properties: expectedProperties } as any]));
            spyOn(component, 'showGroup').and.returnValue(true);

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            fixture.detectChanges();
            await fixture.whenStable();

            const firstGroupedPropertiesComponent = fixture.debugElement.query(
                By.css('.adf-metadata-grouped-properties-container adf-card-view')
            ).componentInstance;
            expect(firstGroupedPropertiesComponent.properties).toBe(expectedProperties);
        });

        it('should pass through the displayEmpty to the card view of grouped properties', async () => {
            component.expanded = true;
            component.displayEmpty = false;

            spyOn(contentMetadataService, 'getGroupedProperties').and.returnValue(of([{ properties: [] } as any]));
            spyOn(component, 'showGroup').and.returnValue(true);

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            fixture.detectChanges();
            await fixture.whenStable();

            const basicPropertiesComponent = fixture.debugElement.query(
                By.css('.adf-metadata-grouped-properties-container adf-card-view')
            ).componentInstance;
            expect(basicPropertiesComponent.displayEmpty).toBe(false);
        });

        it('should hide card views group when the grouped properties are empty', async () => {

            spyOn(contentMetadataService, 'getGroupedProperties').and.stub();

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            fixture.detectChanges();
            await fixture.whenStable();

            const basicPropertiesGroup = fixture.debugElement.query(By.css('.adf-metadata-grouped-properties-container mat-expansion-panel'));
            expect(basicPropertiesGroup).toBeNull();
        });

        it('should display card views group when there is at least one property that is not empty', async () => {
            component.expanded = true;
            spyOn(contentMetadataService, 'getGroupedProperties').and.stub();

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });

            fixture.detectChanges();
            await fixture.whenStable();

            const basicPropertiesGroup = fixture.debugElement.query(By.css('.adf-metadata-grouped-properties-container mat-expansion-panel'));
            expect(basicPropertiesGroup).toBeDefined();
        });
    });

    describe('Properties displaying', () => {
        it('should hide metadata fields if displayDefaultProperties is set to false', () => {
            component.displayDefaultProperties = false;
            fixture.detectChanges();
            const metadataContainer = fixture.debugElement.query(By.css('mat-expansion-panel[data-automation-id="adf-metadata-group-properties"]'));
            fixture.detectChanges();
            expect(metadataContainer).toBeNull();
        });

        it('should display metadata fields if displayDefaultProperties is set to true', () => {
            component.displayDefaultProperties = true;
            fixture.detectChanges();
            const metadataContainer = fixture.debugElement.query(By.css('mat-expansion-panel[data-automation-id="adf-metadata-group-properties"]'));
            fixture.detectChanges();
            expect(metadataContainer).toBeDefined();
        });

        it('should have displayDefaultProperties input param as true by default', () => {
            expect(component.displayDefaultProperties).toBe(true);
        });
    });

    describe('Display properties with aspect oriented config', () => {
        let appConfig: AppConfigService;
        let classesApi: ClassesApi;
        let expectedNode: Node;

        const verResponse: PropertyGroup = {
            name: 'cm:versionable',
            title: 'Versionable',
            properties: {
                'cm:autoVersion': {
                    title: 'Auto Version',
                    name: 'cm:autoVersion',
                    dataType: 'd:boolean',
                    mandatory: false,
                    multiValued: false
                },
                'cm:initialVersion': {
                    title: 'Initial Version',
                    name: 'cm:initialVersion',
                    dataType: 'd:boolean',
                    mandatory: false,
                    multiValued: false
                },
                'cm:versionType': {
                    title: 'Version Type',
                    name: 'cm:versionType',
                    dataType: 'd:text',
                    mandatory: false,
                    multiValued: false
                }
            }
        };

        const exifResponse: PropertyGroup = {
            name: 'exif:exif',
            title: 'Exif',
            properties: {
                'exif:1': {
                    title: 'exif:1:id',
                    name: 'exif:1',
                    dataType: '',
                    mandatory: false,
                    multiValued: false
                },
                'exif:2': {
                    title: 'exif:2:id',
                    name: 'exif:2',
                    dataType: '',
                    mandatory: false,
                    multiValued: false
                },
                'exif:pixelXDimension': {
                    title: 'Image Width',
                    name: 'exif:pixelXDimension',
                    dataType: 'd:int',
                    mandatory: false,
                    multiValued: false
                },
                'exif:pixelYDimension': {
                    title: 'Image Height',
                    name: 'exif:pixelYDimension',
                    dataType: 'd:int',
                    mandatory: false,
                    multiValued: false
                }
            }
        };

        const setContentMetadataConfig = (presetName, presetConfig) => {
            appConfig.config['content-metadata'] = {
                presets: {
                    [presetName]: presetConfig
                }
            };
        };

        beforeEach(() => {
            appConfig = TestBed.inject(AppConfigService);
            const propertyDescriptorsService = TestBed.inject(PropertyDescriptorsService);
            classesApi = propertyDescriptorsService['classesApi'];
            expectedNode = {
                ...node,
                aspectNames: ['rn:renditioned', 'cm:versionable', 'cm:titled', 'cm:auditable', 'cm:author', 'cm:thumbnailModification', 'exif:exif'],
                name: 'some-modified-value',
                properties: {
                    'exif:pixelXDimension': 1024,
                    'exif:pixelYDimension': 1024
                }
            };

            component.expanded = true;
            component.preset = 'default';
        });

        it('should show Versionable with given content-metadata config', async () => {
            setContentMetadataConfig('default', {
                includeAll: false,
                'cm:versionable': '*'
            });

            getClassSpy.and.returnValue(Promise.resolve(verResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const verProp = queryDom(fixture, 'Versionable');

            expect(verProp).toBeTruthy();
            expect(classesApi.getClass).toHaveBeenCalledWith('cm_versionable');
        });

        it('should show Versionable twice with given content-metadata config', async () => {
            setContentMetadataConfig('default', {
                includeAll: true,
                'cm:versionable': '*'
            });

            getClassSpy.and.returnValue(Promise.resolve(verResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const verProps = fixture.debugElement.queryAll(By.css('[data-automation-id="adf-metadata-group-Versionable"]'));

            expect(verProps.length).toEqual(2);
            expect(classesApi.getClass).toHaveBeenCalledWith('cm_versionable');
        });

        it('should not show Versionable with given content-metadata config', async () => {
            setContentMetadataConfig('default', {
                includeAll: true,
                exclude: 'cm:versionable'
            });

            getClassSpy.and.returnValue(Promise.resolve(verResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const verProp = queryDom(fixture, 'Versionable');

            expect(verProp).toBeNull();
            expect(classesApi.getClass).toHaveBeenCalledWith('cm_versionable');
        });

        it('should not show Versionable when excluded and included set in content-metadata config', async () => {
            setContentMetadataConfig('default', {
                includeAll: true,
                exclude: 'cm:versionable',
                'cm:versionable': '*'
            });

            getClassSpy.and.returnValue(Promise.resolve(verResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const verProp = queryDom(fixture, 'Versionable');

            expect(verProp).toBeTruthy();
            expect(classesApi.getClass).toHaveBeenCalledWith('cm_versionable');
        });

        it('should not show aspects excluded in content-metadata config', async () => {
            setContentMetadataConfig('default', {
                includeAll: true,
                exclude: ['cm:versionable', 'cm:auditable']
            });

            getClassSpy.and.returnValue(Promise.resolve(verResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const verProp = queryDom(fixture, 'Versionable');
            expect(verProp).toBeNull();

            const auditableProp = queryDom(fixture, 'Auditable');
            expect(auditableProp).toBeNull();

            expect(classesApi.getClass).toHaveBeenCalledWith('cm_versionable');
            expect(classesApi.getClass).toHaveBeenCalledWith('cm_auditable');
        });

        it('should show Exif even when includeAll is set to false', async () => {
            setContentMetadataConfig('default', {
                includeAll: false,
                'exif:exif': ['exif:pixelXDimension', 'exif:pixelYDimension']
            });

            getClassSpy.and.returnValue(Promise.resolve(exifResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const exifProp = queryDom(fixture, 'Exif');

            expect(exifProp).toBeTruthy();
            expect(classesApi.getClass).toHaveBeenCalledWith('exif_exif');

            exifProp.nativeElement.click();

            const pixelXDimensionElement = fixture.debugElement.query(
                By.css('[data-automation-id="card-textitem-label-properties.exif:pixelXDimension"]')
            );
            expect(pixelXDimensionElement).toBeTruthy();
            expect(pixelXDimensionElement.nativeElement.textContent.trim()).toEqual('Image Width');

            const pixelYDimensionElement = fixture.debugElement.query(
                By.css('[data-automation-id="card-textitem-label-properties.exif:pixelYDimension"]')
            );
            expect(pixelYDimensionElement).toBeTruthy();
            expect(pixelYDimensionElement.nativeElement.textContent.trim()).toEqual('Image Height');
        });

        it('should show Exif twice when includeAll is set to true', async () => {
            setContentMetadataConfig('default', {
                includeAll: true,
                'exif:exif': ['exif:pixelXDimension', 'exif:pixelYDimension']
            });

            getClassSpy.and.returnValue(Promise.resolve(exifResponse));

            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
            fixture.detectChanges();

            await component.groupedProperties$.toPromise();
            fixture.detectChanges();

            const exifProps = fixture.debugElement.queryAll(By.css('[data-automation-id="adf-metadata-group-Exif"]'));

            expect(exifProps.length).toEqual(2);
            expect(classesApi.getClass).toHaveBeenCalledWith('exif_exif');
        });
    });

    describe('Expand the panel', () => {
        let expectedNode: Node;

        beforeEach(() => {
            expectedNode = { ...node, name: 'some-modified-value' };
            spyOn(contentMetadataService, 'getGroupedProperties').and.returnValue(of(mockGroupProperties));
            component.ngOnChanges({ node: new SimpleChange(node, expectedNode, false) });
        });

        it('should open and update drawer with expand section dynamically', async () => {
            component.displayAspect = 'EXIF';
            component.expanded = true;
            component.displayEmpty = true;

            fixture.detectChanges();
            await fixture.whenStable();

            let defaultProp = queryDom(fixture);
            let exifProp = queryDom(fixture, 'EXIF');
            let customProp = queryDom(fixture, 'CUSTOM');
            expect(defaultProp.componentInstance.expanded).toBeFalsy();

            component.displayAspect = 'CUSTOM';

            fixture.detectChanges();
            await fixture.whenStable();

            defaultProp = queryDom(fixture);
            exifProp = queryDom(fixture, 'EXIF');
            customProp = queryDom(fixture, 'CUSTOM');
            expect(defaultProp.componentInstance.expanded).toBeFalsy();
            expect(exifProp.componentInstance.expanded).toBeFalsy();
            expect(customProp.componentInstance.expanded).toBeTruthy();

            component.displayAspect = 'Properties';

            fixture.detectChanges();
            await fixture.whenStable();

            defaultProp = queryDom(fixture);
            exifProp = queryDom(fixture, 'EXIF');
            customProp = queryDom(fixture, 'CUSTOM');
            expect(defaultProp.componentInstance.expanded).toBeTruthy();
            expect(exifProp.componentInstance.expanded).toBeFalsy();
            expect(customProp.componentInstance.expanded).toBeFalsy();
        });

        it('should not expand anything if input is wrong', async () => {
            component.displayAspect = 'XXXX';
            component.expanded = true;
            component.displayEmpty = true;

            fixture.detectChanges();
            await fixture.whenStable();

            const defaultProp = queryDom(fixture);
            const exifProp = queryDom(fixture, 'EXIF');
            expect(defaultProp.componentInstance.expanded).toBeFalsy();
            expect(exifProp.componentInstance.expanded).toBeFalsy();
        });
    });

    describe('events', () => {
        it('should not propagate the event on left arrows press', () => {
            fixture.detectChanges();
            const event = { keyCode: 37, stopPropagation: () => {} };
            spyOn(event, 'stopPropagation').and.stub();
            const element = fixture.debugElement.query(By.css('adf-card-view'));
            element.triggerEventHandler('keydown', event);
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it('should not propagate the event on right arrows press', () => {
            fixture.detectChanges();
            const event = { keyCode: 39, stopPropagation: () => {} };
            spyOn(event, 'stopPropagation').and.stub();
            const element = fixture.debugElement.query(By.css('adf-card-view'));
            element.triggerEventHandler('keydown', event);
            expect(event.stopPropagation).toHaveBeenCalled();
        });

        it('should propagate the event on other keys press', () => {
            fixture.detectChanges();
            const event = { keyCode: 40, stopPropagation: () => {} };
            spyOn(event, 'stopPropagation').and.stub();
            const element = fixture.debugElement.query(By.css('adf-card-view'));
            element.triggerEventHandler('keydown', event);
            expect(event.stopPropagation).not.toHaveBeenCalled();
        });
    });

    describe('Tags list', () => {
        let tagPaging: TagPaging;

        beforeEach(() => {
            tagPaging = mockTagPaging();
            component.displayTags = true;
        });

        it('should render tags after loading tags in ngOnInit', () => {
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(2);
            expect(tagElements[0].nativeElement.textContent).toBe(tagPaging.list.entries[0].entry.tag);
            expect(tagElements[1].nativeElement.textContent).toBe(tagPaging.list.entries[1].entry.tag);
            expect(tagService.getTagsByNodeId).toHaveBeenCalledWith(node.id);
        });

        it('should not render tags after loading tags in ngOnInit if displayTags is false', () => {
            component.displayTags = false;
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(0);
            expect(tagService.getTagsByNodeId).not.toHaveBeenCalled();
        });

        it('should render tags after loading tags in ngOnChanges', () => {
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));

            component.ngOnChanges({
                node: new SimpleChange(undefined, node, false)
            });
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(2);
            expect(tagElements[0].nativeElement.textContent).toBe(tagPaging.list.entries[0].entry.tag);
            expect(tagElements[1].nativeElement.textContent).toBe(tagPaging.list.entries[1].entry.tag);
            expect(tagService.getTagsByNodeId).toHaveBeenCalledWith(node.id);
        });

        it('should not render tags after loading tags in ngOnChanges if displayTags is false', () => {
            component.displayTags = false;
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));

            component.ngOnChanges({
                node: new SimpleChange(undefined, node, false)
            });
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(0);
            expect(tagService.getTagsByNodeId).not.toHaveBeenCalled();
        });

        it('should not render tags after loading tags in ngOnChanges if node is not changed', () => {
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));

            component.ngOnChanges({});
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(0);
            expect(tagService.getTagsByNodeId).not.toHaveBeenCalled();
        });

        it('should not render tags after loading tags in ngOnChanges if node is changed first time', () => {
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));

            component.ngOnChanges({
                node: new SimpleChange(undefined, node, true)
            });
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(0);
            expect(tagService.getTagsByNodeId).not.toHaveBeenCalled();
        });

        it('should render tags after loading tags after clicking on Cancel button', fakeAsync(() => {
            component.editableTags = true;
            fixture.detectChanges();
            TestBed.inject(CardViewContentUpdateService).itemUpdated$.next({
                changed: {}
            } as UpdateNotification);
            tick(500);
            fixture.detectChanges();
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            findCancelTagsButton().click();
            component.editableTags = false;
            fixture.detectChanges();
            const tagElements = findTagElements();
            expect(tagElements).toHaveSize(2);
            expect(tagElements[0].nativeElement.textContent).toBe(tagPaging.list.entries[0].entry.tag);
            expect(tagElements[1].nativeElement.textContent).toBe(tagPaging.list.entries[1].entry.tag);
            expect(tagService.getTagsByNodeId).toHaveBeenCalledOnceWith(node.id);
        }));

        it('should be hidden when editable is true', () => {
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            fixture.detectChanges();

            component.editableTags = true;
            fixture.detectChanges();
            expect(findTagElements()).toHaveSize(0);
        });
    });

    describe('Tags creator', () => {
        let tagsCreator: TagsCreatorComponent;

        beforeEach(() => {
            component.editableTags = true;
            component.displayTags = true;
            fixture.detectChanges();
            tagsCreator = findTagsCreator();
        });

        it('should have assigned false to tagNameControlVisible initially', () => {
            expect(tagsCreator.tagNameControlVisible).toBeFalse();
        });

        it('should show showing tag input button after emitting tagNameControlVisibleChange event with false', fakeAsync(() => {
            tagsCreator.tagNameControlVisibleChange.emit(true);
            fixture.detectChanges();
            tick();
            tagsCreator.tagNameControlVisibleChange.emit(false);
            fixture.detectChanges();
            tick(100);
            expect(findShowingTagInputButton().hasAttribute('hidden')).toBeFalse();
        }));

        it('should have assigned correct mode', () => {
            expect(tagsCreator.mode).toBe(TagsCreatorMode.CREATE_AND_ASSIGN);
        });

        it('should enable cancel button after emitting tagsChange event', () => {
            tagsCreator.tagsChange.emit(['New tag 1', 'New tag 2', 'New tag 3']);
            fixture.detectChanges();
            expect(findCancelTagsButton().disabled).toBeFalse();
        });

        it('should enable save button after emitting tagsChange event', () => {
            tagsCreator.tagsChange.emit(['New tag 1', 'New tag 2', 'New tag 3']);
            fixture.detectChanges();
            expect(findSaveTagsButton().disabled).toBeFalse();
        });

        it('should have assigned false to disabledTagsRemoving', () => {
            expect(tagsCreator.disabledTagsRemoving).toBeFalse();
        });

        it('should have assigned false to disabledTagsRemoving if forkJoin fails', () => {
            const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
            const expectedNode = { ...node, name: 'some-modified-value' };
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));
            const tagPaging = mockTagPaging();
            spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            component.ngOnInit();
            spyOn(tagService, 'removeTag').and.returnValue(throwError({}));
            spyOn(tagService, 'assignTagsToNode').and.returnValue(EMPTY);
            const tagName1 = tagPaging.list.entries[0].entry.tag;
            const tagName2 = 'New tag 3';

            updateService.update(property, 'updated-value');

            fixture.detectChanges();
            tagsCreator.tagsChange.emit([tagName1, tagName2]);
            clickOnTagsSave();

            expect(tagsCreator.disabledTagsRemoving).toBeFalse();
        });

        describe('Setting tags', () => {
            let tagPaging: TagPaging;

            beforeEach(() => {
                tagPaging = mockTagPaging();
                spyOn(tagService, 'getTagsByNodeId').and.returnValue(of(tagPaging));
            });

            it('should assign correct tags after ngOnInit', () => {
                component.ngOnInit();

                fixture.detectChanges();
                expect(tagsCreator.tags).toEqual([tagPaging.list.entries[0].entry.tag, tagPaging.list.entries[1].entry.tag]);
                expect(tagService.getTagsByNodeId).toHaveBeenCalledWith(node.id);
            });

            it('should assign correct tags after ngOnChanges', () => {
                component.ngOnInit();

                fixture.detectChanges();
                expect(tagsCreator.tags).toEqual([tagPaging.list.entries[0].entry.tag, tagPaging.list.entries[1].entry.tag]);
                expect(tagService.getTagsByNodeId).toHaveBeenCalledWith(node.id);
            });
        });
    });

    it('should show tags creator if editable is true and displayTags is true', () => {
        component.editableTags = true;
        component.displayTags = true;
        fixture.detectChanges();
        expect(findTagsCreator()).toBeDefined();
    });

    describe('Categories list', () => {
        beforeEach(() => {
            component.displayCategories = true;
            component.node.aspectNames.push('generalclassifiable');
            spyOn(categoryService, 'getCategoryLinksForNode').and.returnValue(of(categoryPagingResponse));
        });

        it('should render categories node is assigned to', () => {
            component.ngOnInit();
            fixture.detectChanges();

            const categories = getCategories();
            expect(categories.length).toBe(2);
            expect(categories[0].textContent).toBe(category1.name);
            expect(categories[1].textContent).toBe(category2.name);
            expect(categoryService.getCategoryLinksForNode).toHaveBeenCalledWith(node.id);
        });

        it('should not render categories after loading categories in ngOnInit if displayCategories is false', () => {
            component.displayCategories = false;
            component.ngOnInit();
            fixture.detectChanges();

            const categories = getCategories();
            expect(categories).toHaveSize(0);
            expect(categoryService.getCategoryLinksForNode).not.toHaveBeenCalled();
        });

        it('should render categories when ngOnChanges', () => {
            component.ngOnChanges({ node: new SimpleChange(undefined, node, false) });
            fixture.detectChanges();

            const categories = getCategories();
            expect(categories.length).toBe(2);
            expect(categories[0].textContent).toBe(category1.name);
            expect(categories[1].textContent).toBe(category2.name);
            expect(categoryService.getCategoryLinksForNode).toHaveBeenCalledWith(node.id);
        });

        it('should not render categories after loading categories in ngOnChanges if displayCategories is false', () => {
            component.displayCategories = false;
            component.ngOnChanges({
                node: new SimpleChange(undefined, node, false)
            });
            fixture.detectChanges();
            const categories = getCategories();
            expect(categories).toHaveSize(0);
            expect(categoryService.getCategoryLinksForNode).not.toHaveBeenCalled();
        });

        it('should not reload categories in ngOnChanges if node is not changed', () => {
            component.ngOnChanges({});
            fixture.detectChanges();

            expect(categoryService.getCategoryLinksForNode).not.toHaveBeenCalled();
        });

        it('should render categories after discard changes button is clicked', fakeAsync(() => {
            component.editableCategories = true;
            fixture.detectChanges();
            TestBed.inject(CardViewContentUpdateService).itemUpdated$.next({
                changed: {}
            } as UpdateNotification);
            tick(500);
            fixture.detectChanges();

            clickOnCancel();
            component.editable = false;
            fixture.detectChanges();

            const categories = getCategories();
            expect(categories.length).toBe(2);
            expect(categories[0].textContent).toBe(category1.name);
            expect(categories[1].textContent).toBe(category2.name);
            expect(categoryService.getCategoryLinksForNode).toHaveBeenCalledWith(node.id);
            discardPeriodicTasks();
            flush();
        }));

        it('should be hidden when editable is true', () => {
            component.editableCategories = true;
            fixture.detectChanges();
            expect(getCategories().length).toBe(0);
        });
    });

    describe('Categories management', () => {
        let categoriesManagementComponent: CategoriesManagementComponent;

        beforeEach(() => {
            component.editableCategories = true;
            component.displayCategories = true;
            component.node.aspectNames.push('generalclassifiable');
            spyOn(categoryService, 'getCategoryLinksForNode').and.returnValue(of(categoryPagingResponse));
            fixture.detectChanges();
            categoriesManagementComponent = getCategoriesManagementComponent();
        });

        it('should set categoryNameControlVisible to false initially', () => {
            expect(categoriesManagementComponent.categoryNameControlVisible).toBeFalse();
        });

        it('should show assign categories button when categoryNameControlVisible changes to false', fakeAsync(() => {
            categoriesManagementComponent.categoryNameControlVisibleChange.emit(true);
            fixture.detectChanges();
            tick();
            categoriesManagementComponent.categoryNameControlVisibleChange.emit(false);
            fixture.detectChanges();
            tick(100);
            expect(getAssignCategoriesBtn().hasAttribute('hidden')).toBeFalse();
        }));

        it('should have correct mode', () => {
            expect(categoriesManagementComponent.managementMode).toBe(CategoriesManagementMode.ASSIGN);
        });

        it('should clear categories and emit event when classifiable changes', (done) => {
            component.node.aspectNames = [];
            component.ngOnChanges({ node: new SimpleChange(undefined, node, false) });
            component.classifiableChanged.subscribe(() => {
                expect(component.categories).toEqual([]);
                done();
            });
            component.ngOnChanges({ node: new SimpleChange(undefined, node, false) });
        });

        it('should enable discard and save buttons after emitting categories change event', () => {
            categoriesManagementComponent.categoriesChange.emit([category1, category2]);
            fixture.detectChanges();
            expect(findCancelButton().disabled).toBeFalse();
            expect(findSaveCategoriesButton().disabled).toBeFalse();
        });

        it('should not disable removal initially', () => {
            expect(categoriesManagementComponent.disableRemoval).toBeFalse();
        });

        it('should not disable removal if forkJoin fails',() => {
            const property = { key: 'properties.property-key', value: 'original-value' } as CardViewBaseItemModel;
            const expectedNode = { ...node, name: 'some-modified-value' };
            spyOn(nodesApiService, 'updateNode').and.returnValue(of(expectedNode));
            component.ngOnInit();
            spyOn(tagService, 'removeTag').and.returnValue(EMPTY);
            spyOn(tagService, 'assignTagsToNode').and.returnValue(EMPTY);
            spyOn(categoryService, 'unlinkNodeFromCategory').and.returnValue(EMPTY);
            spyOn(categoryService, 'linkNodeToCategory').and.returnValue(throwError({}));

            updateService.update(property, 'updated-value');

            fixture.detectChanges();
            categoriesManagementComponent.categoriesChange.emit([category1, category2]);
            findSaveCategoriesButton();

            expect(categoriesManagementComponent.disableRemoval).toBeFalse();
        });

        describe('Setting categories', () => {
            it('should set correct categories after ngOnInit', () => {
                component.ngOnInit();

                fixture.detectChanges();
                expect(categoriesManagementComponent.categories).toEqual([category1, category2]);
                expect(categoryService.getCategoryLinksForNode).toHaveBeenCalledWith(node.id);
            });

            it('should set correct tags after ngOnChanges', () => {
                component.ngOnChanges({ node: new SimpleChange(undefined, node, false) });

                fixture.detectChanges();
                expect(categoriesManagementComponent.categories).toEqual([category1, category2]);
                expect(categoryService.getCategoryLinksForNode).toHaveBeenCalledWith(node.id);
            });
        });
    });

    describe('Custom metadata panels', () => {
        it('should render correct custom panel with title and component', () => {
            component.customPanels = [{ panelTitle: 'testTitle', component: 'testComponent' }];
            fixture.detectChanges();
            const panelTitle = fixture.debugElement.queryAll(By.css('mat-panel-title'))[1].nativeElement;
            const customComponent = fixture.debugElement.query(By.css('adf-dynamic-component')).nativeElement;
            expect(panelTitle.innerText).toEqual('testTitle');
            expect(customComponent).toBeDefined();
        });
    });
});

const queryDom = (fixture: ComponentFixture<ContentMetadataComponent>, properties: string = 'properties') =>
    fixture.debugElement.query(By.css(`[data-automation-id="adf-metadata-group-${properties}"]`));
