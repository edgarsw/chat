import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { catchError, filter, map, Observable, of, Subject, take, takeUntil, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MessageQuery } from '../../store/message.query';
import { MessageStore } from '../../store/message.store';
import { ClientQuery } from '../../store/client.query';
import { LoadMessages, Message } from '../../model/messages.model';
import { Client } from '../../model/client.model';
import { MessageService } from '../../services/message.service';
import { scrollToBottomMessages } from '../../helpers/chat.helper';

@Component({
  selector: 'app-messages',
  imports: [CommonModule],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesComponent {

  protected messages$: Observable<Message[]> | undefined;
  @ViewChild('messagesDiv') messagesDiv!: ElementRef;
  private isLoading = false; // Flag to avoid duplicate calls

  private destroy$ = new Subject<void>();

  protected selectedClientValue: Client | undefined;

  constructor(
    private readonly messageService: MessageService,
    private readonly messageStore: MessageStore,
    private readonly messageQuery: MessageQuery,
    private readonly clientQuery: ClientQuery,
  ) { }  

  ngOnInit() {
    this.messages$ = this.messageQuery.selectAll().pipe(map((messages: any[]) => { return [...messages] }));
    this.getClient();
    this.loadMessages();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getClient() {
    this.clientQuery.selectedClient().pipe(
      takeUntil(this.destroy$),
      filter((client) => !!client),
      tap((client) => { this.selectedClientValue = client }),
    ).subscribe();
  }

  private loadMessages(){
    this.messageService.loadMessages
    .pipe(
      takeUntil(this.destroy$),
      tap((load) => {
        if(load.loadMessages){
          this.loadMoreMessages(load.conversationId, load);
        }
      })
    ).subscribe();
  }

  protected onScrollMessages(event: Event) {
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

  private loadMoreMessages(conversionId: number, load: LoadMessages = { scrollBottom: false, loadMessages: false, conversationId: 0 }) {
    this.messageService.loadMoreMessages(conversionId)?.
      pipe(
        take(1),
        tap(()=> {
          if(load.scrollBottom){
            scrollToBottomMessages();
          }
          if(load.loadMessages){
            this.messageService.emitLoadMessages({ scrollBottom: false, loadMessages: false, conversationId: 0 })}
          }
        ),
        catchError((error) => {
          console.error('Error loading more messages:', error);
          return of(null);
        })
      ).subscribe();
  }
}
