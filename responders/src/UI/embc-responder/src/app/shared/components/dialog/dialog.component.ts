import {
  Component, ComponentFactoryResolver, ComponentRef, Inject, OnDestroy, OnInit,
  ViewChild, ViewContainerRef, ViewEncapsulation
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog',
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class DialogComponent implements OnInit, OnDestroy {

  @ViewChild('target', { read: ViewContainerRef, static: true }) vcRef: ViewContainerRef;

  componentRef: ComponentRef<any>;

  constructor(
    public dialogRef: MatDialogRef<DialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private resolver: ComponentFactoryResolver) { }

  ngOnInit(): void {
    const factory = this.resolver.resolveComponentFactory(this.data.component);
    this.componentRef = this.vcRef.createComponent(factory);
    if (this.data.text !== undefined && this.data.text !== null) {
      this.componentRef.instance.inputEvent = this.data.text;
    }
    this.componentRef.instance.outputEvent.subscribe(value => {
      this.buttonAction(value);
    });
  }

  buttonAction(action: string): void {
    this.dialogRef.close(action);
  }

  ngOnDestroy(): void {
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

}
