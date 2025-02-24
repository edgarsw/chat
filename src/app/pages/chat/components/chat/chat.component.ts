import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { ClientQuery } from '../../store/client.query';

import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {BreakpointObserver, LayoutModule} from '@angular/cdk/layout';
import {MatFormFieldModule} from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { map, Observable, Subject, takeUntil } from 'rxjs';
import { Client } from '../../model/client.model';


@Component({
  selector: 'app-chat',
  imports: [CommonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule, LayoutModule, FormsModule, ReactiveFormsModule, 
    MatFormFieldModule, MatInputModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

  protected formGroup: FormGroup | undefined;

  @ViewChild(MatSidenav, {static: true})
  sidenav!: MatSidenav;

  protected clients$: Observable<Client[]> | undefined;

  private destroy$ = new Subject<void>();


  constructor(
    private readonly clientService: ClientService,
    private readonly clientQuery: ClientQuery,
    private readonly formBuilder: FormBuilder,
    private readonly observer: BreakpointObserver,
  )  {}

  ngOnInit():void{
    console.log('ejecucion');
    this.createForm();
    this.configSidebar();
    this.clientService.loadMoreClients();
    this.clients$ = this.clientQuery.selectAll().pipe(map((clients: any[]) => [...clients]));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(){
    this.formGroup = this.formBuilder.group(
      {
        message: ['']
      }
    );
  }

  private configSidebar() {
    this.observer.observe(["(max-width: 800px)"])
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.matches) {
          this.sidenav.mode = "over";
          this.sidenav.close();
        } else {
          this.sidenav.mode = "side";
          this.sidenav.open();
        }
      });
  }
}
