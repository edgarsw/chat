import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { ClientSignalService } from '../../services/client-signal.service';
import { ClientSignalQuery } from '../../store/client-signal.query';

import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { LayoutModule } from '@angular/cdk/layout';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, fromEvent, map, Observable, of, Subject, switchMap, take, takeUntil, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { MessageSignalService } from '../../services/message-signal.service';
import { MessageSignalQuery } from '../../store/message-signal.query';
import { Message } from '../../model/messages.model';
import { MessageSignalStore } from '../../store/message-signal.store';
import { ClientSignalStore } from '../../store/client-signal.store';
import { ClientStatus } from '../../enum/client.status.enum';
import { HeaderSignalComponent } from '../header/header-signal.component';


@Component({
  selector: 'app-chat',
  imports: [CommonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule, LayoutModule, FormsModule, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, HeaderSignalComponent],
  templateUrl: './chat-signal.component.html',
  styleUrl: './chat-signal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatSignalComponent {

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
    private readonly clientService: ClientSignalService,
    private readonly clientQuery: ClientSignalQuery,
    private readonly clientStore: ClientSignalStore,
    private readonly formBuilder: FormBuilder,
    private readonly messageService: MessageSignalService,
    private readonly messageQuery: MessageSignalQuery,
    private readonly messageStore: MessageSignalStore,
  ) { }

  ngOnInit(): void {
    this.clients$ = this.clientQuery.selectAll().pipe(map((clients: any[]) => [...clients]));
    this.messages$ = this.messageQuery.selectAll().pipe(map((messages: any[]) => [...messages]));
    //this.scrollEvent$.subscribe((event: Event) => this.onScrollMessages(event));
    this.createForm();
    this.getFirstClient();
    this.connectWS();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();

    fromEvent(this.messagesDiv.nativeElement, 'scroll')
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100),
      )
      .subscribe((event: any) => this.onScrollMessages(event));
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
    this.clientService.loadMoreClients()?.pipe(
      take(1),
      catchError((error) => {
        console.error('Error loading more clients:', error);
        return of(null);
      }),
    ).subscribe();
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
        this.loadMoreMessagesScroll(); // Call the API after a bit delay

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

  private loadMoreMessagesScroll() {
    if (this.selectedClientValue) {
      if (this.selectedClientValue?.conversations?.length > 0) {
        const conversionId = this.selectedClientValue.conversations[0].idconversation;
        this.loadMoreMessages(conversionId);
      }
    }
  }

  private loadMoreMessages(conversionId: number) {
    this.messageService.loadMoreMessages(conversionId)?.
      pipe(
        catchError((error) => {
          console.error('Error loading more messages:', error);
          return of(null);
        })
      ).subscribe();
  }

  private getFirstClient() {
    this.clientService.loadMoreClients()?.pipe(
      take(1),
      switchMap(() => {
        this.selectedClient$ = this.clientQuery.selectFirstClient()
          .pipe(
            take(1),
            tap((client) => {
              if (!client || !client.conversations?.length) return;

              if (!this.selectedClientValue || this.selectedClientValue.idclient !== client.idclient) {
                this.selectedClientValue = JSON.parse(JSON.stringify(client));

                this.clientService.emitCurrentClient(client);

                this.loadMoreMessages(client?.conversations[0]?.idconversation);
                this.clientQuery.updateClientStatus(client.idclient, ClientStatus.SELECTED);
              }
            }
            ));
        return this.selectedClient$;
      }),
      catchError((error) => {
        console.error('Error loading more clients:', error);
        return of(null);
      }),
    ).subscribe();

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

          this.clientService.emitCurrentClient(client);

          this.clientQuery.changeClientStatus(client.idclient);
          this.clientQuery.updateClientSentMessage(client.idclient, false);
          this.messageService.joinConversation(this.getConversationId()!);
          this.messageQuery.resetToDefaul();
          this.clientsSet.delete(client.idclient);
          this.loadMoreMessages(conversionId);
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
