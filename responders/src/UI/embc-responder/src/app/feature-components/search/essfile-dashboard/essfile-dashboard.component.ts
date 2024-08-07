import { Component, OnInit } from '@angular/core';
import { Router, RouterLinkActive, RouterLink, RouterOutlet } from '@angular/router';
import { AddressModel } from 'src/app/core/models/address.model';
import { EvacuationFileModel } from 'src/app/core/models/evacuation-file.model';
import { Community } from 'src/app/core/services/locations.service';
import { AlertService } from 'src/app/shared/components/alert/alert.service';
import { EssfileDashboardService } from './essfile-dashboard.service';
import * as globalConst from '../../../core/services/global-constants';
import { Note } from 'src/app/core/api/models';
import { DashboardBanner } from 'src/app/core/models/dialog-content.model';
import { AppBaseService } from 'src/app/core/services/helper/appBase.service';
import { OptionInjectionService } from 'src/app/core/interfaces/searchOptions.service';
import { SelectedPathType } from 'src/app/core/models/appBase.model';
import { OverlayLoaderComponent } from '../../../shared/components/overlay-loader/overlay-loader.component';
import { HouseholdMemberComponent } from './household-member/household-member.component';
import { MatSidenavContainer, MatSidenav, MatSidenavContent } from '@angular/material/sidenav';
import { MatButton, MatAnchor } from '@angular/material/button';
import { NgIf, NgClass, UpperCasePipe, TitleCasePipe, DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { DialogComponent } from 'src/app/shared/components/dialog/dialog.component';
import { InformationDialogComponent } from 'src/app/shared/components/dialog-components/information-dialog/information-dialog.component';

@Component({
  selector: 'app-essfile-dashboard',
  templateUrl: './essfile-dashboard.component.html',
  styleUrls: ['./essfile-dashboard.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgClass,
    MatButton,
    MatSidenavContainer,
    MatSidenav,
    MatAnchor,
    RouterLinkActive,
    RouterLink,
    MatSidenavContent,
    RouterOutlet,
    HouseholdMemberComponent,
    OverlayLoaderComponent,
    UpperCasePipe,
    TitleCasePipe,
    DatePipe
  ]
})
export class EssfileDashboardComponent implements OnInit {
  essFile: EvacuationFileModel;
  notesList: Array<Note>;
  isLoading = false;
  color = '#169BD5';
  isMinor = false;
  isLinkedToBcsc = false;
  hasPostal = false;
  eligibilityFirstName: string;
  eligibilityLastName: string;
  displayBanner: DashboardBanner;

  constructor(
    private router: Router,
    private essfileDashboardService: EssfileDashboardService,
    private alertService: AlertService,
    public appBaseService: AppBaseService,
    private optionInjectionService: OptionInjectionService,
    private dialog: MatDialog
  ) {}

  async ngOnInit(): Promise<void> {
    if (
      this.optionInjectionService.instance.optionType === SelectedPathType.remoteExtensions ||
      this.optionInjectionService.instance.optionType === SelectedPathType.caseNotes
    ) {
      this.isLoading = !this.isLoading;
      const $p = await this.optionInjectionService.instance.loadEssFile().then(async (file) => {
        const $pp = await this.optionInjectionService.instance
          .loadEvcaueeProfile(file.primaryRegistrantId)
          .then((profile) => {
            this.notesList = this.essfileDashboardService.loadNotes(file.notes);
            this.essFile = file;
            this.loadDefaultOverviewSection(file);
            this.displayBanner = this.optionInjectionService.instance.getDashboardBanner(file?.status);
            this.isLoading = !this.isLoading;
            if (this.notesList.some((el) => el.isImportant)) {
              this.showImportantNotesWarning();
            }
          });
      });
    } else {
      this.getEssFile();
    }

    const profile$ = await this.essfileDashboardService.updateMember();

    this.isMinor = this.appBaseService?.appModel?.selectedProfile?.selectedEvacueeInContext?.isMinor;
    this.isLinkedToBcsc = this.appBaseService?.appModel?.selectedProfile?.selectedEvacueeInContext?.authenticatedUser;
    this.hasPostal = this.essfileDashboardService.hasPostalCode();

    this.essfileDashboardService.showFileLinkingPopups();

    this.eligiblityDisplayName();
  }

  /**
   * Returns community name
   *
   * @param address evacuated from address
   * @returns community name
   */
  communityName(address: AddressModel): string {
    return (address?.community as Community)?.name;
  }

  /**
   * Open the dialog with definition of
   * profile status
   */
  openStatusDefinition(): void {
    this.essfileDashboardService.openStatusDefinition();
  }

  openWizard() {
    const wizardType = this.essfileDashboardService.getWizardType(
      this.optionInjectionService.instance.optionType,
      this.essFile
    );
    this.isLoading = !this.isLoading;
    this.optionInjectionService?.instance
      ?.openWizard(wizardType)
      ?.then((value) => {
        this.isLoading = !this.isLoading;
      })
      .catch(() => {
        this.isLoading = !this.isLoading;
      });
  }

  /**
   * Loads the default file overview page
   *
   * @param essFile retrieved evacuation file
   */
  loadDefaultOverviewSection(essFile: EvacuationFileModel) {
    this.router.navigate(['/responder-access/search/essfile-dashboard/overview'], {
      state: { file: essFile }
    });
  }

  /**
   * Loads the ESS file for a give file number
   */
  private async getEssFile() {
    this.isLoading = !this.isLoading;

    await this.optionInjectionService.instance
      .loadEssFile()
      .then(async (file) => {
        this.notesList = this.essfileDashboardService.loadNotes(file.notes);
        this.essFile = file;
        this.essfileDashboardService.essFile = file;
        this.loadDefaultOverviewSection(file);
        this.displayBanner = this.optionInjectionService.instance.getDashboardBanner(file?.status);
        this.isLoading = !this.isLoading;
        if (this.notesList.some((el) => el.isImportant)) {
          this.showImportantNotesWarning();
        }
      })
      .catch((error) => {
        this.isLoading = !this.isLoading;
        this.alertService.clearAlert();
        this.alertService.setAlert('danger', globalConst.fileDashboardError);
      });
  }

  private eligiblityDisplayName() {
    this.eligibilityFirstName = this.essfileDashboardService.eligibilityFirstName();

    this.eligibilityLastName = this.essfileDashboardService.eligibilityLastName();
  }
  private showImportantNotesWarning(): void {
    const content = globalConst.caseProfileNotesWarning;
    this.dialog
      .open(DialogComponent, {
        data: {
          component: InformationDialogComponent,
          content
        },
        width: '580px'
      })
      .afterClosed()
      .subscribe((event) => {
        if (event === 'confirm') {
          this.router.navigate(['/responder-access/search/essfile-dashboard/notes'], {
            state: { notes: this.notesList }
          });
        }
      });
  }
}
