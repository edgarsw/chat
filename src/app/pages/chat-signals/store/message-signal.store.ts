import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Message } from '../model/messages.model';

export interface MessageSignalState extends EntityState<Message, number> {
   currentPage: number;
   hasMore: boolean;
}

@Injectable({providedIn: 'root'})
@StoreConfig({ name: 'message-signal', idKey: 'uniqueId', resettable: true })
export class MessageSignalStore extends EntityStore<MessageSignalState> {
  constructor() {
    super({
      currentPage: 0,
      hasMore: true
    });
  }
}