import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Client } from '../model/client.model';
import { Injectable } from '@angular/core';

export interface ClientSignalState extends EntityState<Client,number> {
   currentPage: number;
   hasMore: boolean;
}

@Injectable({providedIn: 'root'})
@StoreConfig({ name: 'client', idKey: 'uniqueId' })
export class ClientSignalStore extends EntityStore<ClientSignalState> {
  constructor() {
    super({
      currentPage: 0,
      hasMore: true
    });
  }
}