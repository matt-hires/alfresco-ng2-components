/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
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

import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateLoader, TranslateStore, TranslateService } from '@ngx-translate/core';

import { MaterialModule } from './material.module';
import { AboutModule } from './about/about.module';
import { AppConfigModule } from './app-config/app-config.module';
import { CardViewModule } from './card-view/card-view.module';
import { ContextMenuModule } from './context-menu/context-menu.module';
import { DataTableModule } from './datatable/datatable.module';
import { InfoDrawerModule } from './info-drawer/info-drawer.module';
import { LanguageMenuModule } from './language-menu/language-menu.module';
import { LoginModule } from './login/login.module';
import { PaginationModule } from './pagination/pagination.module';
import { ToolbarModule } from './toolbar/toolbar.module';
import { UserInfoModule } from './userinfo/userinfo.module';
import { ViewerModule } from './viewer/viewer.module';
import { FormBaseModule } from './form/form-base.module';
import { SidenavLayoutModule } from './layout/layout.module';
import { CommentsModule } from './comments/comments.module';
import { ButtonsMenuModule } from './buttons-menu/buttons-menu.module';
import { TemplateModule } from './templates/template.module';
import { ClipboardModule } from './clipboard/clipboard.module';
import { NotificationHistoryModule } from './notifications/notification-history.module';
import { BlankPageModule } from './blank-page/blank-page.module';

import { DirectiveModule } from './directives/directive.module';
import { DownloadZipDialogModule } from './dialogs/download-zip/download-zip.dialog.module';
import { PipeModule } from './pipes/pipe.module';

import { AlfrescoApiService } from './services/alfresco-api.service';
import { TranslationService } from './services/translation.service';
import { startupServiceFactory } from './services/startup-service-factory';
import { SortingPickerModule } from './sorting-picker/sorting-picker.module';
import { IconModule } from './icon/icon.module';
import { TranslateLoaderService } from './services/translate-loader.service';
import { ExtensionsModule } from '@alfresco/adf-extensions';
import { directionalityConfigFactory } from './services/directionality-config-factory';
import { DirectionalityConfigService } from './services/directionality-config.service';
import { SearchTextModule } from './search-text/search-text-input.module';
import { AlfrescoJsClientsModule } from '@alfresco/adf-core/api';
import { AuthenticationInterceptor, Authentication } from '@alfresco/adf-core/auth';
import { LegacyApiClientModule } from './api-factories/legacy-api-client.module';
import { RichTextEditorModule } from './rich-text-editor/rich-text-editor.module';
import { HttpClientModule, HttpClientXsrfModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthenticationService } from './auth/services/authentication.service';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';

interface LegacyMonolithCoreModuleConfig {
    authByJsApi: boolean;
}

const defaultConfig: LegacyMonolithCoreModuleConfig = {
    authByJsApi: true
};

@NgModule({
    imports: [
        TranslateModule,
        ExtensionsModule,
        AboutModule,
        ViewerModule,
        SidenavLayoutModule,
        PipeModule,
        CommonModule,
        DirectiveModule,
        DownloadZipDialogModule,
        FormsModule,
        ReactiveFormsModule,
        UserInfoModule,
        MaterialModule,
        AppConfigModule,
        PaginationModule,
        ToolbarModule,
        ContextMenuModule,
        CardViewModule,
        FormBaseModule,
        CommentsModule,
        LoginModule,
        LanguageMenuModule,
        InfoDrawerModule,
        DataTableModule,
        ButtonsMenuModule,
        TemplateModule,
        IconModule,
        SortingPickerModule,
        NotificationHistoryModule,
        SearchTextModule,
        BlankPageModule,
        LegacyApiClientModule,
        AlfrescoJsClientsModule,
        RichTextEditorModule,
        HttpClientModule,
        HttpClientXsrfModule.withOptions({
            cookieName: 'CSRF-TOKEN',
            headerName: 'X-CSRF-TOKEN'
        })
    ],
    exports: [
        AboutModule,
        ViewerModule,
        SidenavLayoutModule,
        PipeModule,
        CommonModule,
        DirectiveModule,
        DownloadZipDialogModule,
        ClipboardModule,
        FormsModule,
        ReactiveFormsModule,
        UserInfoModule,
        MaterialModule,
        AppConfigModule,
        PaginationModule,
        ToolbarModule,
        ContextMenuModule,
        CardViewModule,
        FormBaseModule,
        CommentsModule,
        LoginModule,
        LanguageMenuModule,
        InfoDrawerModule,
        DataTableModule,
        TranslateModule,
        ButtonsMenuModule,
        TemplateModule,
        SortingPickerModule,
        IconModule,
        NotificationHistoryModule,
        SearchTextModule,
        BlankPageModule,
        RichTextEditorModule
    ]
})
export class CoreModule {
    static forRoot(config: LegacyMonolithCoreModuleConfig = defaultConfig): ModuleWithProviders<CoreModule> {
        debugger;
        return {
            ngModule: CoreModule,
            providers: [
                TranslateStore,
                TranslateService,
                { provide: TranslateLoader, useClass: TranslateLoaderService },
                ...(config.authByJsApi ?
                    [{
                        provide: APP_INITIALIZER,
                        useFactory: startupServiceFactory,
                        deps: [ AlfrescoApiService ], multi: true
                }] : []),
                {
                    provide: APP_INITIALIZER,
                    useFactory: directionalityConfigFactory,
                    deps: [DirectionalityConfigService],
                    multi: true
                },
                { provide: HTTP_INTERCEPTORS, useClass: AuthenticationInterceptor, multi: true },
                { provide: Authentication, useClass: AuthenticationService },
                {
                    provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
                    useValue: {
                        duration: 10000
                    }
                }
            ]
        };
    }

    static forChild(): ModuleWithProviders<CoreModule> {
        return {
            ngModule: CoreModule
        };
    }

    constructor(translation: TranslationService) {
        translation.addTranslationFolder('adf-core', 'assets/adf-core');
    }
}
