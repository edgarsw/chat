import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Message } from '../model/messages.model';

export interface MessageState extends EntityState<Message, number> {
   currentPage: number;
   hasMore: boolean;
}

@Injectable({providedIn: 'root'})
@StoreConfig({ name: 'message', idKey: 'uniqueId', resettable: true })
export class MessageStore extends EntityStore<MessageState> {
  constructor() {
    super({
      currentPage: 0,
      hasMore: true
    });
  }
}