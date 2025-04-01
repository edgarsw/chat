import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Injectable } from '@angular/core';
import { Message } from '../model/messages.model';

export interface MessageSignalsState extends EntityState<Message, number> {
   currentPage: number;
   hasMore: boolean;
}

@Injectable({providedIn: 'root'})
@StoreConfig({ name: 'message', idKey: 'uniqueId', resettable: true })
export class MessageSignalsStore extends EntityStore<MessageSignalsState> {
  constructor() {
    super({
      currentPage: 0,
      hasMore: true
    });
  }
}