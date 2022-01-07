import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { EvacueeSearchService } from '../evacuee-search.service';

@Component({
  selector: 'app-data-entry',
  templateUrl: './data-entry.component.html',
  styleUrls: ['./data-entry.component.scss']
})
export class DataEntryComponent implements OnInit {
  @Output() showDataEntryComponent = new EventEmitter<boolean>();
  @Output() showIDPhotoComponent = new EventEmitter<boolean>();

  dataEntryForm: FormGroup;
  isPaperBased: boolean;
  constructor(
    private builder: FormBuilder,
    private evacueeSearchService: EvacueeSearchService
  ) {}

  ngOnInit(): void {
    this.constructDataEntryForm();
    this.isPaperBased = this.evacueeSearchService?.paperBased;

    if (this.isPaperBased) {
      this.dataEntryForm.get('paperBased').setValue(true);
    }
  }

  /**
   * Returns form control
   */
  get dataEntryFormControl(): { [key: string]: AbstractControl } {
    return this.dataEntryForm.controls;
  }

  /**
   * Saves the seach parameter into the model and Navigates to the evacuee-name-search component
   */
  next(): void {
    if (this.dataEntryForm.valid) {
      this.evacueeSearchService.paperBased =
        this.dataEntryForm.get('paperBased').value;
      this.showDataEntryComponent.emit(false);
      this.showIDPhotoComponent.emit(true);
    } else {
      this.dataEntryForm.markAllAsTouched();
    }
  }

  /**
   * Builds the form
   */
  private constructDataEntryForm(): void {
    this.dataEntryForm = this.builder.group({
      paperBased: ['', [Validators.required]]
    });
  }
}
