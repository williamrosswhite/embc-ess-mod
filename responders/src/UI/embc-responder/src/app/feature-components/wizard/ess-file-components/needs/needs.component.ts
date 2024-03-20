import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { StepEssFileService } from '../../step-ess-file/step-ess-file.service';
import * as globalConst from '../../../../core/services/global-constants';
import { WizardService } from '../../wizard.service';
import { TabModel } from 'src/app/core/models/tab.model';
import { EvacueeSessionService } from 'src/app/core/services/evacuee-session.service';
import { startWith } from 'rxjs/operators';

@Component({
  selector: 'app-needs',
  templateUrl: './needs.component.html',
  styleUrls: ['./needs.component.scss']
})
export class NeedsComponent implements OnInit, OnDestroy {
  needsForm: UntypedFormGroup;
  radioOption = globalConst.needsOptions;
  tabUpdateSubscription: Subscription;
  tabMetaData: TabModel;

  constructor(
    private router: Router,
    private stepEssFileService: StepEssFileService,
    private formBuilder: UntypedFormBuilder,
    private wizardService: WizardService,
    private evacueeSessionService: EvacueeSessionService
  ) {}

  ngOnInit(): void {
    // Creates the main form
    this.createNeedsForm();

    // Creates conditional checkbox logic
    this.subscribeToCheckboxes();

    // Set "update tab status" method, called for any tab navigation
    this.tabUpdateSubscription =
      this.stepEssFileService.nextTabUpdate.subscribe(() => {
        this.updateTabStatus();
      });

    this.tabMetaData = this.stepEssFileService.getNavLinks('needs');
  }

  /**
   * Returns the control of the form
   */
  get needsFormControl(): { [key: string]: AbstractControl } {
    return this.needsForm.controls;
  }

  /**
   * Goes back to the previous ESS File Tab
   */
  back(): void {
    this.router.navigate([this.tabMetaData?.previous]);
  }

  /**
   * Goes to the next tab from the ESS File
   */
  next(): void {
    if (this.evacueeSessionService.isPaperBased) {
      this.stepEssFileService.nextTabUpdate.next();

      if (this.stepEssFileService.checkTabsStatus()) {
        this.stepEssFileService.openModal(globalConst.wizardESSFileMessage);
      } else {
        this.router.navigate([this.tabMetaData?.next]);
      }
    } else {
      this.router.navigate([this.tabMetaData?.next]);
    }
  }

  /**
   * When navigating away from tab, update variable value and status indicator
   */
  ngOnDestroy(): void {
    if (this.stepEssFileService.checkForEdit()) {
      const isFormUpdated = this.wizardService.hasChanged(
        this.needsForm.controls,
        'needs'
      );

      this.wizardService.setEditStatus({
        tabName: 'needs',
        tabUpdateStatus: isFormUpdated
      });
      this.stepEssFileService.updateEditedFormStatus();
    }
    this.stepEssFileService.nextTabUpdate.next();
    this.tabUpdateSubscription.unsubscribe();
  }

  // TODO: all the hard work behind the scenes
  private createNeedsForm(): void {
    this.needsForm = this.formBuilder.group({
      doesEvacueeNotRequireAssistance: [false],
      canEvacueeProvideFood: [
        this.stepEssFileService.canRegistrantProvideFood ?? '',
        Validators.required
      ],
      canEvacueeProvideLodging: [
        this.stepEssFileService.canRegistrantProvideLodging ?? '',
        Validators.required
      ],
      canEvacueeProvideClothing: [
        this.stepEssFileService.canRegistrantProvideClothing ?? '',
        Validators.required
      ],
      canEvacueeProvideTransportation: [
        this.stepEssFileService.canRegistrantProvideTransportation ?? '',
        Validators.required
      ],
      canEvacueeProvideIncidentals: [
        this.stepEssFileService.canRegistrantProvideIncidentals ?? '',
        Validators.required
      ]
    });
  }

  /**
   * Subscribes to changes in the form and updates the doesEvacueeNotRequireAssistance checkbox
   */
  private subscribeToCheckboxes() {
    this.needsForm.get('doesEvacueeNotRequireAssistance').valueChanges.subscribe(value => {
      if (value) {
        // If doesEvacueeNotRequireAssistance is true, set all other form controls to false and disable them
        Object.keys(this.needsForm.controls).forEach(key => {
          if (key !== 'doesEvacueeNotRequireAssistance') {
            this.needsForm.get(key).setValue(false, {emitEvent: false});
            this.needsForm.get(key).disable({emitEvent: false});
          }
        });
      } else {
        // If doesEvacueeNotRequireAssistance is false, enable all other form controls
        Object.keys(this.needsForm.controls).forEach(key => {
          if (key !== 'doesEvacueeNotRequireAssistance') {
            this.needsForm.get(key).enable({emitEvent: false});
          }
        });
      }
    });

    // Subscribe to changes in all other checkboxes
    const otherCheckboxes = Object.keys(this.needsForm.controls)
      .filter(key => key !== 'doesEvacueeNotRequireAssistance')
      .map(key => this.needsForm.get(key).valueChanges.pipe(startWith(this.needsForm.get(key).value)));

    // Combine the changes and update the doesEvacueeNotRequireAssistance checkbox
    combineLatest(otherCheckboxes).subscribe(values => {
      let doesEvacueeNotRequireAssistance = this.needsForm.get('doesEvacueeNotRequireAssistance');
      if (values.some(value => value)) {
        doesEvacueeNotRequireAssistance.setValue(false, {emitEvent: false});        
        doesEvacueeNotRequireAssistance.disable({emitEvent: false});
      }
      else {
        doesEvacueeNotRequireAssistance.enable({emitEvent: false});
      }      
    });
  }

  /**
   * Updates the Tab Status from Incomplete, Complete or in Progress
   */
  private updateTabStatus() {
    if (this.needsForm.valid) {
      this.stepEssFileService.setTabStatus('needs', 'complete');
    } else if (this.stepEssFileService.checkForPartialUpdates(this.needsForm)) {
      this.stepEssFileService.setTabStatus('needs', 'incomplete');
    } else {
      this.stepEssFileService.setTabStatus('needs', 'not-started');
    }
    this.saveFormData();
  }

  /**
   * Saves information inserted inthe form into the service
   */
  private saveFormData() {
    this.stepEssFileService.canRegistrantProvideFood = this.needsForm.get(
      'canEvacueeProvideFood').value;
    this.stepEssFileService.canRegistrantProvideLodging = this.needsForm.get(
      'canEvacueeProvideLodging').value;
    this.stepEssFileService.canRegistrantProvideClothing = this.needsForm.get(
      'canEvacueeProvideClothing').value;
    this.stepEssFileService.canRegistrantProvideTransportation = this.needsForm.get(
      'canEvacueeProvideTransportation').value;
    this.stepEssFileService.canRegistrantProvideIncidentals = this.needsForm.get(
      'canEvacueeProvideIncidentals').value;
  }
}
