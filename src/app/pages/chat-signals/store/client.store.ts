import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Client } from '../model/client.model';
import { computed, Injectable, signal } from '@angular/core';

export interface ClientSignalsState extends EntityState<Client,number> {
   currentPage: number;
   hasMore: boolean;
}

@Injectable({providedIn: 'root'})
@StoreConfig({ name: 'client', idKey: 'uniqueId' })
export class ClientSignalsStore extends EntityStore<ClientSignalsState> {
  constructor() {
    super({
      currentPage: 0,
      hasMore: true
    });
  }
}