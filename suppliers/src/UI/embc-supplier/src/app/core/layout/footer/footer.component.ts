import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { DialogContent } from '../../model/dialog-content.model';
import { InformationDialog } from '../../components/dialog/information-dialog';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
    appVersion: string;
    constructor(private httpClient: HttpClient, private dialog: MatDialog) { }

    ngOnInit() {
        this.appVersion = environment.version;
    }

    openVersionsModal(): void {
        this.httpClient.get('version').subscribe((response) => {
            let content = response as { name: string; version: string }[];
            content.push({name: "EMBC.Suppliers.UI", version: this.appVersion});
            const dialog = this.dialog.open(InformationDialog, {
                data: {
                    title: "Version Information",
                    content: this.versionDialog(content),
                },
                autoFocus: false,
                width: '530px'
            });
        });
    }

    private versionDialog(
        versions: { name: string; version: string }[]
    ): DialogContent {
        const rows = versions
            .map(
                (version) =>
                    `<tr><td>${version.name}</td><td>${version.version}</td></tr>`
            )
            .join('');
        return {
            text: `<table class="versions-table">${rows}</table>`,
            cancelButton: 'Close',
            title: 'Version Information'
        };
    }
}
