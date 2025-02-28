import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ClientService } from '../../services/client.service';
import { ClientQuery } from '../../store/client.query';

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { map, Observable, Subject, take, takeUntil, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { ClientStatus } from '../../enum/client.status.enum';
import { MessageService } from '../../services/message.service';
import { MessageQuery } from '../../store/message.query';
import { Message } from '../../model/messages.model';


@Component({
  selector: 'app-chat',
  imports: [CommonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule, LayoutModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})
export class ChatComponent {

  protected formGroup: FormGroup | undefined;

  @ViewChild(MatSidenav, { static: true })
  sidenav!: MatSidenav;

  protected clients$: Observable<Client[]> | undefined;
  protected messages$: Observable<Message[]> | undefined;

  private destroy$ = new Subject<void>();

  protected selectedClient$: Observable<Client> | undefined;
  protected selectedClientValue: Client | undefined;


  constructor(
    private readonly clientService: ClientService,
    private readonly clientQuery: ClientQuery,
    private readonly formBuilder: FormBuilder,
    private readonly observer: BreakpointObserver,
    private readonly messageService: MessageService,
    private readonly messageQuery: MessageQuery,
  ) { }

  ngOnInit(): void {
    this.clients$ = this.clientQuery.selectAll().pipe(map((clients: any[]) => [...clients]));
    this.messages$ = this.messageQuery.selectAll().pipe(map((messages: any[]) => [...messages]));
    this.createForm();
    this.configSidebar();
    this.getClients();
    this.setFirstClient();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm() {
    this.formGroup = this.formBuilder.group(
      {
        message: ['']
      }
    );
  }

  private getClients() {
    this.clientService.loadMoreClients();
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

  protected onScrollClient(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      this.getClients();
    }
  }

  protected onScrollMessages(event: Event) {
    const element = event.target as HTMLElement;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {

    }
  }



  private setFirstClient() {
    this.selectedClient$ = this.clientQuery.selectFirstClient()
      .pipe(
        take(1),
        tap((client) => {
          if (!client || !client.conversations?.length) return;

          if (!this.selectedClientValue || this.selectedClientValue.idclient !== client.idclient) {
            this.selectedClientValue = JSON.parse(JSON.stringify(client));
            this.clientQuery.changeClientStatus(client.idclient);
            this.messageService.loadMoreMessages(client?.conversations[0]?.idconversation);
            //this.clientQuery.updateClientStatus(client.idclient, ClientStatus.SELECTED);
          }
        }
        ));
  }

  protected onSelectClient(clientId: number) {

    if (this.selectedClientValue?.idclient === clientId) return;

    this.selectedClient$ = this.clientQuery.selectClientById(clientId).pipe(
      take(1),
      tap((client) => {
        if (!client || !client.conversations?.length) return;

        const conversionId = client.conversations[0].idconversation;

        if (!this.selectedClientValue || this.selectedClientValue.idclient !== client.idclient) {
          this.selectedClientValue = JSON.parse(JSON.stringify(client));
          this.clientQuery.changeClientStatus(client.idclient);
          this.messageQuery.resetToDefaul();
          this.messageService.loadMoreMessages(conversionId);
          this.scrollBottom();
        }
      })
    )
  }

  private scrollBottom() {
    const scrollMessageArea = document.querySelector('.messages-area') as HTMLElement;
    if (scrollMessageArea) {
      scrollMessageArea.scrollTop = scrollMessageArea.scrollHeight;
    }
  }
}
