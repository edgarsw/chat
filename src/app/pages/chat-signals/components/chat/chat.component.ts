import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';
import { ClientSignalsService } from '../../services/client.service';
import { ClientSignalsQuery } from '../../store/client.query';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Observable, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { MessageSignalsService } from '../../services/message.service';
import { MessageSignalsStore } from '../../store/message.store';
import { ClientSignalsStore } from '../../store/client.store';
import { ClientStatus } from '../../enum/client.status.enum';
import { HeaderComponent } from '../header/header.component';
import { MessagesComponent } from '../messages/messages.component';
import { ClientsComponent } from '../clients/clients.component';
import { MessageFormComponent } from '../message-form/message-form.component';
import { HeaderSidenavComponent } from '../header-sidenav/header-sidenav.component';
import { TopicComponent } from '../topic/topic.component';
import { scrollToBottomMessages } from '../../helpers/chat.helper';

@Component({
  selector: 'app-chat',
  imports: [CommonModule, MatSidenavModule, HeaderComponent, MessagesComponent, ClientsComponent,
    MessageFormComponent, HeaderSidenavComponent, TopicComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  @ViewChild(MatSidenav, { static: true })
  sidenav!: MatSidenav;

  protected selectedClient$: Observable<Client> | undefined;
  protected selectedClientValue: Client | undefined;

  protected clientsSet: Set<number> = new Set<number>();

  private destroy$ = new Subject<void>();

  constructor(
    private readonly clientService: ClientSignalsService,
    private readonly clientQuery: ClientSignalsQuery,
    private readonly clientStore: ClientSignalsStore,
    private readonly messageService: MessageSignalsService,
    private readonly messageStore: MessageSignalsStore,
  ) { }

  ngOnInit(): void {
    this.getClient();
    this.connectWS();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getClient() {
    this.selectedClientValue = this.clientQuery.selectedClient()!;
  }

  private connectWS() {
    this.employeeMessagesWS();
    this.conversationsWS();
    this.clientMessagesWS();
  }

  /**
   * This method is when a employee send a message and after that he recieves the same message of return
   * to display it in the messages area.
   */
  private employeeMessagesWS() {
    this.messageService.employeeMessagesWS()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((message: any) => {
        if (message.conversation.idconversation === this.getConversationId()) {
          this.messageStore.upsert(message.idmessage, message);
          scrollToBottomMessages();
        }
      });
  }

  /**
   * When the client send a message from his phone then this client is set in the top on the clients list
   * and mark with an icon indicating that this client just send a message
   * if the client not is in the store then is necesary to get a client
   * and add the client in the store in the top of the list
   */
  private clientMessagesWS() {
    this.messageService.clientMessagesWS()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((message: any) => {
          if (message.conversation.idconversation === this.getConversationId()) {
            this.messageStore.upsert(message.idmessage, message);
            this.clientsSet.delete(message.conversation.client?.idclient!);
            scrollToBottomMessages();
            //this.clientQuery.moveClientToTop(message.conversation.client?.idclient!);
            return of(null); // do nothing else
          }

          const foundClientId = this.findClient(message.conversation.client?.idclient!);
          if (foundClientId) {
            this.clientsSet.add(message.conversation.client?.idclient!);
            this.clientQuery.moveClientToTop(message.conversation.client?.idclient!);
            this.clientQuery.updateClientSentMessage(message.conversation.client?.idclient!, true);
            return of(null); // do nothing else
          }

          // If the client is not in the store, it is recovered from the service
          return this.clientService.getClientById(message.conversation.client?.idclient!);
        }),
        tap((client) => {
          if (client) {
            this.clientStore.upsert(client.idclient, client);
            this.clientsSet.add(client.idclient);
            this.clientQuery.moveClientToTop(client.idclient);
            this.clientQuery.updateClientSentMessage(client.idclient, true);
          }
        })
      )
      .subscribe();
  }

  /**
   * when a new conversation was created if the client not is in the store then is necesary to get a client
   * and add the client in the store in the top of the list
   */
  private conversationsWS() {
    this.clientService.onNewConversation()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((client: any) => {
        this.clientQuery.addClientToTop(client);
        this.clientQuery.updateClientStatus(client.idclient, ClientStatus.NEW);
      });
  }

  private findClient(clientId: number) {
    return this.clientStore.getValue().ids?.find(id => id === clientId);
  }

  public onSelectClient(message: any) {
    const { idclient, conversationId } = message;
    this.clientsSet.delete(idclient);
    const payload = { scrollBottom: true, loadMessages: true, conversationId };
    this.messageService.emitLoadMessages(payload);
  }

  private getConversationId(): number | undefined {
    return this.selectedClientValue?.conversations[0].idconversation;
  }
}
