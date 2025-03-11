import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { debounceTime, fromEvent, map, Observable, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { MessageService } from '../../services/message.service';
import { MessageQuery } from '../../store/message.query';
import { Message } from '../../model/messages.model';
import { MessageStore } from '../../store/message.store';
import { ClientStore } from '../../store/client.store';
import { ClientStatus } from '../../enum/client.status.enum';


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

  @ViewChild('messagesDiv') messagesDiv!: ElementRef;
  private isLoading = false; // Flag to avoid duplicate calls
  private scrollEvent$ = fromEvent(document, 'scroll').pipe(debounceTime(300)); // Wait 300ms between events

  protected clientsSet: Set<number> = new Set<number>();


  constructor(
    private readonly clientService: ClientService,
    private readonly clientQuery: ClientQuery,
    private readonly clientStore: ClientStore,
    private readonly formBuilder: FormBuilder,
    private readonly observer: BreakpointObserver,
    private readonly messageService: MessageService,
    private readonly messageQuery: MessageQuery,
    private readonly messageStore: MessageStore,
  ) { }

  ngOnInit(): void {
    this.clients$ = this.clientQuery.selectAll().pipe(map((clients: any[]) => [...clients]));
    this.messages$ = this.messageQuery.selectAll().pipe(map((messages: any[]) => [...messages]));
    this.scrollEvent$.subscribe((event: Event) => this.onScrollMessages(event));
    this.createForm();
    this.configSidebar();
    this.getClients();
    this.setFirstClient();
    this.connectWS();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
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
          this.scrollToBottom();
        }
        // count the new message from another client conversation
        this.clientsSet.add(message.conversation?.client.idclient);
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
            this.scrollToBottom();
            this.clientQuery.moveClientToTop(message.conversation.client?.idclient!);
            return of(null); // do nothing else
          }

          const foundClientId = this.findClient(message.conversation.client?.idclient!);
          if (foundClientId) {
            this.clientsSet.add(message.conversation.client?.idclient!);
            this.clientQuery.moveClientToTop(message.conversation.client?.idclient!);
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

  scrollToBottom() {
    setTimeout(() => {
      const messagesArea = document.querySelector('.messages-area') as HTMLElement;
      if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
      }
    }, 100);
  }

  private getConversationId(): number | undefined {
    return this.selectedClientValue?.conversations[0].idconversation;
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

  onScrollMessages(event: Event) {
    const target = event.target as HTMLElement;

    // If there arent more messages then return
    if (this.isLoading || !this.messageStore.getValue().hasMore) {
      return;
    }

    // Detect if the user continues scrolling to top
    if (target.scrollTop <= 0) {
      this.isLoading = true; // Active load flag

      const previousHeight = target.scrollHeight; // Save the height before to load more messages

      setTimeout(() => {
        this.loadMoreMessages(); // Call the API after a bit delay

        setTimeout(() => {
          if (this.messageStore.getValue().hasMore) {
            const newHeight = target.scrollHeight;
            // target.scrollTop = newHeight - previousHeight; // Keep the scroll position
            target.scrollTo({ top: newHeight - previousHeight, behavior: 'smooth' }); // Keep the scroll position and to do it with smooth
          }

          this.isLoading = false; // Resets the flag after the load
        }, 50);
      }, 500); // Delay 500ms before to do the require
    }
  }

  private loadMoreMessages() {
    if (this.selectedClientValue) {
      if (this.selectedClientValue?.conversations?.length > 0) {
        const conversionId = this.selectedClientValue.conversations[0].idconversation;
        this.messageService.loadMoreMessages(conversionId);
      }
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
            this.messageService.loadMoreMessages(client?.conversations[0]?.idconversation);
            this.clientQuery.updateClientStatus(client.idclient, ClientStatus.SELECTED);
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
          this.messageService.joinConversation(this.getConversationId()!);
          this.messageQuery.resetToDefaul();
          this.clientsSet.delete(client.idclient);
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

  sendMessage() {
    if (this.formGroup?.get('message')?.value.trim()) {
      this.messageService.sendMessage(this.getConversationId()!, this.formGroup?.get('message')?.value.trim(), 'empleado', 1);
      this.formGroup?.get('message')?.setValue('');
      this.clientQuery.moveClientToTop(this.selectedClientValue?.idclient!);
      this.clientsScrollToTop();
    }
  }

  clientsScrollToTop() {
    setTimeout(() => {
      const clientsArea = document.querySelector('.scroll-container') as HTMLElement;
      if (clientsArea) {
        clientsArea.scrollTop = 0;
      }
    }, 100);
  }
}
