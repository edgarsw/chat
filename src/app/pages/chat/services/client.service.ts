import { Injectable } from '@angular/core';
import { ClientStore } from '../store/client.store';
import { HttpClient } from '@angular/common/http';
import { enviroment } from '../../../../environments/enviroment.qa';
import { Client } from '../model/client.model';
import { map, Observable, of, tap } from 'rxjs';
import { ClientStatus } from '../enum/client.status.enum';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private readonly LIMIT = 15;
  private BASE_URL = enviroment.baseUrl;

  private socket: Socket;

  constructor(
    private readonly clientStore: ClientStore, 
    private readonly http: HttpClient) {
    this.socket = io(this.BASE_URL);
  }

  loadMoreClients(): Observable<{ data: Client[] }> {
    const state = this.clientStore.getValue();

    if (!state.hasMore) return of({ data: [] });

    const nextPage = state.currentPage + 1;

    const payload = {
      page: nextPage,
      limit: this.LIMIT,
      conversation: {
        isactiva: 1
      }
    }

    return this.http.post<{ data: Client[], hasMore: boolean }>(`${this.BASE_URL}/clients`, payload)
      .pipe(
        map(response => {
          return {
            data: response.data.map(client => ({
              ...client,
              statusui: ClientStatus.NONE,
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
      );

  }

  // Escuchar nuevos mensajes
  onNewConversation(): Observable<Client> {
    return new Observable(observer => {
      this.socket.on('newConversation', response => observer.next(response.client.data));
    });
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<any>(`${this.BASE_URL}/clients${id}`)
      .pipe(
        map((result) => result.data as Client)
      );
  }
}
