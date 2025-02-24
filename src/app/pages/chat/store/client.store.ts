import { EntityState, EntityStore, Store, StoreConfig } from '@datorama/akita';
import { Client } from '../model/client.model';
import { Injectable } from '@angular/core';

export interface ClientState extends EntityState<Client> {
   currentPage: number;
   hasMore: boolean;
}

@Injectable({providedIn: 'root'})
@StoreConfig({ name: 'client', idKey: 'uniqueId' })
export class ClientStore extends EntityStore<ClientState> {
  constructor() {
    super({
      currentPage: 0,
      hasMore: true
    });
  }
}