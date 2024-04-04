import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EvacuationFileModel } from 'src/app/core/models/evacuation-file.model';
import { HouseholdMemberModel } from 'src/app/core/models/household-member.model';
import { EssfileDashboardService } from '../essfile-dashboard.service';
import * as globalConst from '../../../../core/services/global-constants';
import { EvacuationFileHouseholdMember, IdentifiedNeed } from 'src/app/core/api/models';

@Component({
  selector: 'app-ess-file-details',
  templateUrl: './ess-file-details.component.html',
  styleUrls: ['./ess-file-details.component.scss']
})
export class EssFileDetailsComponent implements OnInit {
  essFile: EvacuationFileModel;

  IdentifiedNeed = IdentifiedNeed;

  memberListDisplay: EvacuationFileHouseholdMember[];

  memberColumns: string[] = ['firstName', 'lastName', 'dateOfBirth'];
  petColumns: string[] = ['type', 'quantity'];

  constructor(
    private router: Router,
    private essfileDashboardService: EssfileDashboardService
  ) {
    if (this.router.getCurrentNavigation() !== null) {
      if (this.router.getCurrentNavigation().extras.state !== undefined) {
        const state = this.router.getCurrentNavigation().extras.state as {
          file: EvacuationFileModel;
        };
        this.essFile = state.file;
      }
    } else {
      this.essFile = this.essfileDashboardService.essFile;
    }
  }

  ngOnInit(): void {
    this.memberListDisplay = this.essFile?.needsAssessment?.householdMembers;
  }

  /**
  * Returns if incoming need exists in ess file needs assessment needs
   *
   * @param incomingNeed needs assessment value
   * @returns boolean
   */
  doesIncludeNeed(incomingNeed: IdentifiedNeed | null): boolean {
    if(incomingNeed === null && this.essFile?.needsAssessment?.needs?.length === 0){
      return true;
    } else {
      return this.essFile?.needsAssessment?.needs?.includes(incomingNeed);
    }
  }
}
