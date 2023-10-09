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

import { Component, Inject, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import { DateFnsUtils, UserPreferencesService, UserPreferenceValues } from '@alfresco/adf-core';

import { SearchWidget } from '../../models/search-widget.interface';
import { SearchWidgetSettings } from '../../models/search-widget-settings.interface';
import { SearchQueryBuilderService } from '../../services/search-query-builder.service';
import { LiveErrorStateMatcher } from '../../forms/live-error-state-matcher';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DateFnsAdapter, MAT_DATE_FNS_FORMATS } from '@angular/material-date-fns-adapter';
import { endOfDay, endOfToday, isBefore, isValid, startOfDay } from 'date-fns';

export interface DateRangeValue {
    from: string;
    to: string;
}

const DEFAULT_FORMAT_DATE: string = 'DD/MM/YYYY';

@Component({
    selector: 'adf-search-date-range',
    templateUrl: './search-date-range.component.html',
    styleUrls: ['./search-date-range.component.scss'],
    providers: [
        { provide: DateAdapter, useClass: DateFnsAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: MAT_DATE_FNS_FORMATS }
    ],
    encapsulation: ViewEncapsulation.None,
    host: { class: 'adf-search-date-range' }
})
export class SearchDateRangeComponent implements SearchWidget, OnInit, OnDestroy {
    from: UntypedFormControl;
    to: UntypedFormControl;

    form: UntypedFormGroup;
    matcher = new LiveErrorStateMatcher();

    id: string;
    settings?: SearchWidgetSettings;
    context?: SearchQueryBuilderService;
    datePickerFormat: string;
    maxDate: any;
    fromMaxDate: any;
    isActive = false;
    startValue: any;
    enableChangeUpdate: boolean;
    displayValue$: Subject<string> = new Subject<string>();

    private onDestroy$ = new Subject<boolean>();

    constructor(private dateAdapter: DateAdapter<DateFnsAdapter>,
        private userPreferencesService: UserPreferencesService,
        @Inject(MAT_DATE_FORMATS) private dateFormatConfig: MatDateFormats) {}

    getFromValidationMessage(): string {
        return this.from.hasError('invalidOnChange') || this.hasParseError(this.from)
            ? 'SEARCH.FILTER.VALIDATION.INVALID-DATE'
            : this.from.hasError('matDatepickerMax')
            ? 'SEARCH.FILTER.VALIDATION.BEYOND-MAX-DATE'
            : this.from.hasError('required')
            ? 'SEARCH.FILTER.VALIDATION.REQUIRED-VALUE'
            : '';
    }

    getToValidationMessage(): string {
        return this.to.hasError('invalidOnChange') || this.hasParseError(this.to)
            ? 'SEARCH.FILTER.VALIDATION.INVALID-DATE'
            : this.to.hasError('matDatepickerMin')
            ? 'SEARCH.FILTER.VALIDATION.NO-DAYS'
            : this.to.hasError('matDatepickerMax')
            ? 'SEARCH.FILTER.VALIDATION.BEYOND-MAX-DATE'
            : this.to.hasError('required')
            ? 'SEARCH.FILTER.VALIDATION.REQUIRED-VALUE'
            : '';
    }

    ngOnInit() {
        this.datePickerFormat = this.settings?.dateFormat ? DateFnsUtils.convertMomentToDateFnsFormat(this.settings.dateFormat) :
        DateFnsUtils.convertMomentToDateFnsFormat(DEFAULT_FORMAT_DATE);
        this.dateFormatConfig.display.dateInput = this.datePickerFormat;

        this.userPreferencesService
            .select(UserPreferenceValues.Locale)
            .pipe(takeUntil(this.onDestroy$))
            .subscribe((locale) => this.setLocale(locale));

        const validators = Validators.compose([Validators.required]);

        if (this.settings?.maxDate) {
            if (this.settings.maxDate === 'today') {
                this.maxDate = endOfToday();
            } else {
                this.maxDate = endOfDay(new Date(this.settings.maxDate));
            }
        }

        if (this.startValue) {
            const splitValue = this.startValue.split('||');
            const fromValue = this.dateAdapter.parse(splitValue[0], this.datePickerFormat);
            const toValue = this.dateAdapter.parse(splitValue[1], this.datePickerFormat);
            this.from = new UntypedFormControl(fromValue, validators);
            this.to = new UntypedFormControl(toValue, validators);
        } else {
            this.from = new UntypedFormControl('', validators);
            this.to = new UntypedFormControl('', validators);
        }

        this.form = new UntypedFormGroup({
            from: this.from,
            to: this.to
        });

        this.setFromMaxDate();
        this.enableChangeUpdate = this.settings?.allowUpdateOnChange ?? true;
    }

    ngOnDestroy() {
        this.onDestroy$.next(true);
        this.onDestroy$.complete();
    }

    apply(model: { from: string; to: string }, isFormValid: boolean) {
        if (isFormValid && this.id && this.context && this.settings && this.settings.field) {
            this.isActive = true;

            const start = startOfDay(new Date(model.from)).toISOString();
            const end = endOfDay(new Date(model.to)).toISOString();

            this.context.queryFragments[this.id] = `${this.settings.field}:['${start}' TO '${end}']`;

            this.updateDisplayValue();
            this.context.update();
        }
    }

    submitValues() {
        this.apply(this.form.value, this.form.valid);
    }

    hasValidValue(): boolean {
        return this.form.valid;
    }

    getCurrentValue(): DateRangeValue {
        return {
            from: this.dateAdapter.format(this.form.value.from, this.datePickerFormat),
            to: this.dateAdapter.format(this.form.value.from, this.datePickerFormat)
        };
    }

    updateDisplayValue(): void {
        if (this.form.invalid || this.form.pristine) {
            this.displayValue$.next('');
        } else {
            this.displayValue$.next(
                `${this.dateAdapter.format(this.form.value.from, this.datePickerFormat)} - ${this.dateAdapter.format(
                    this.form.value.to,
                    this.datePickerFormat
                )}`
            );
        }
    }

    setValue(parsedDate: string) {
        const splitValue = parsedDate.split('||');
        const fromValue = this.dateAdapter.parse(splitValue[0], this.datePickerFormat);
        const toValue = this.dateAdapter.parse(splitValue[1], this.datePickerFormat);
        this.from.setValue(fromValue);
        this.from.markAsDirty();
        this.from.markAsTouched();
        this.to.setValue(toValue);
        this.to.markAsDirty();
        this.to.markAsTouched();
        this.submitValues();
    }
    clear() {
        this.isActive = false;
        this.form.reset({
            from: '',
            to: ''
        });

        if (this.id && this.context) {
            this.context.queryFragments[this.id] = '';
            if (this.enableChangeUpdate) {
                this.updateQuery();
            }
        }
        this.setFromMaxDate();
    }

    reset() {
        this.clear();
        this.updateQuery();
    }

    private updateQuery() {
        if (this.id && this.context) {
            this.updateDisplayValue();
            this.context.update();
        }
    }

    onChangedHandler(event: any, formControl: UntypedFormControl) {
        const inputValue = event.value;
        const formatDate = this.dateAdapter.parse(inputValue, this.datePickerFormat);
        if (formatDate && isValid(formatDate)) {
            formControl.setValue(formatDate);
        } else if (formatDate) {
            formControl.setErrors({
                invalidOnChange: true
            });
        }

        this.setFromMaxDate();
    }

    setLocale(locale: string) {
        this.dateAdapter.setLocale(DateFnsUtils.getLocaleFromString(locale));
    }

    hasParseError(formControl: UntypedFormControl): boolean {
        return formControl.hasError('matDatepickerParse') && formControl.getError('matDatepickerParse').text;
    }

    forcePlaceholder(event: any) {
        event.srcElement.click();
    }

    setFromMaxDate() {
        this.fromMaxDate = (!this.to.value || this.maxDate && (isBefore(this.maxDate, this.to.value))) ? this.maxDate : this.to.value;
    }
}
