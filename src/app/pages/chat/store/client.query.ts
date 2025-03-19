
import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClientState, ClientStore } from './client.store';
import { filter, map, Observable } from 'rxjs';
import { ClientStatus } from '../enum/client.status.enum';
import { Client } from '../model/client.model';


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

  selectClientById(id: number) {
    return this.selectEntity(id).pipe(
      filter(client => !!client)
    );
  }

  moveClientToTop(id: number) {//modificar
    const ids = this.store.getValue().ids as number[];
    const index = ids.indexOf(id);

    this.store.move(index, 0);
  }

  addClientToTop(client: Client) {
    this.store.add(
      { ...client, uniqueId: client.idclient } as any,
      { prepend: true } // Lo coloca al inicio
    );
  }

  updateClientStatus(clientId: number, status: string) {
    this.store.update(clientId, { statusui: status });
  }

  updateClientSentMessage(clientId: number, sentMessage: boolean) {
    this.store.update(clientId, { sentMessage });
  }

  changeClientStatus(newSelectedclientId: number) {
    const currentSelectedClient = Object.values(this.getValue().entities ?? {}).find(
      client => client.statusui === ClientStatus.SELECTED //missing the comparation only it had an =
    );

    if (currentSelectedClient) {
      this.store.update(currentSelectedClient.idclient, { statusui: ClientStatus.NONE });
    }

    this.store.update(newSelectedclientId, { statusui: ClientStatus.SELECTED });
  }
  
  selectedClient(): Observable<Client | undefined> {
    return this.selectAll().pipe(
      map(clients => clients.find(client => client.statusui === ClientStatus.SELECTED))
    );
  }
}

