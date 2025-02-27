
import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClientState, ClientStore } from './client.store';
import { filter } from 'rxjs';
import { ClientStatus } from '../enum/client.status.enum';


@Injectable({ providedIn: 'root' })
export class ClientQuery extends QueryEntity<ClientState> {
  constructor(protected override store: ClientStore) {
    super(store);
  }

  selectFirstClient() {
    return this.selectFirst().pipe(
      filter(client => !!client)
    );
  }

  updateClientStatus(clientId: number, status: string) {
    this.store.update(clientId, { statusui: status });
  }

  changeClientStatus(newSelectedclientId: number) {
    const currentSlectedClient = Object.values(this.getValue().entities ?? {}).find(
      client => client.statusui = ClientStatus.SELECTED
    );

    if (currentSlectedClient) {
      this.store.update(currentSlectedClient.idclient, { statusui: ClientStatus.NONE });
    }

    this.store.update(newSelectedclientId, { statusui: ClientStatus.SELECTED });
  }
}

