
import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClientState, ClientStore } from './client.store';


@Injectable({ providedIn: 'root' })
export class ClientQuery extends QueryEntity<ClientState>{
  constructor(protected override store: ClientStore){
    super(store);
  }
}

