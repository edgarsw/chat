import { Injectable } from '@angular/core';
import { ClientStore } from '../store/client.store';
import { HttpClient } from '@angular/common/http';
import { enviroment } from '../../../../environments/enviroment.qa';
import { Client } from '../model/client.model';
import { map, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private readonly LIMIT = 20;
  private BASE_URL = enviroment.baseUrl;

  constructor(
    private clientStore: ClientStore,
    private http: HttpClient,
  ) { }

  loadMoreClients() {
    const state = this.clientStore.getValue();

    if (!state.hasMore) return;

    const nextPage = state.currentPage + 1;

    const payload = {
      page: nextPage,
      limit: this.LIMIT,
      conversation: {
        isactiva: 1
      }
    }

    this.http.post<{ data: Client[]; total: number }>(`${this.BASE_URL}/clients`, payload)
      .pipe(
        map(response => {
          return {
            data: response.data.map(client => ({
              ...client,
              uniqueId: client.idclient
            })),
            hasMore: response.data.length === this.LIMIT,
          };
        }),
        tap(({ data, hasMore }) => {
          const existingClients = this.clientStore.getValue().entities ?? {};

          const newClients = data.filter(client => !existingClients[client.uniqueId]);

          if (newClients.length > 0) {
            this.clientStore.update({
              currentPage: nextPage,
              hasMore
            });
            this.clientStore.add(data);
          }
        })
      ).subscribe();

  }
}
