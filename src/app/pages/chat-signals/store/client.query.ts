
import { computed, Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClientSignalsState, ClientSignalsStore } from './client.store';
import { ClientStatus } from '../enum/client.status.enum';
import { Client } from '../model/client.model';


@Injectable({ providedIn: 'root' })
export class ClientSignalsQuery extends QueryEntity<ClientSignalsState> {
  constructor(protected override store: ClientSignalsStore) {
    super(store);
  }
  hasMore = computed(() => this.getValue().hasMore);
  currentPage = computed(() => this.getValue().currentPage);

  public clients = computed(() => this.getAll());

  public firstClient = computed(() => {
    return this.clients().length > 0 ? this.clients()[0] : null;
  });

  public selectClientById = (id: number) => computed(() => this.getEntity(id) ?? null);

  public selectedClient = computed(() => {
    const clients = this.clients();
    return clients.find(client => client.statusui === ClientStatus.SELECTED) ?? null;
  });

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
}

