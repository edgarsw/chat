import { Injectable, signal } from "@angular/core";
import { enviroment } from "../../../../environments/enviroment.qa";
import { MessageSignalsStore } from "../store/message.store";
import { HttpClient } from "@angular/common/http";
import { LoadMessages, Message } from "../model/messages.model";
import { map, Observable, of, tap } from "rxjs";
import { Pagination } from "../model/pagination.model";
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class MessageSignalsService {

    private readonly LIMIT = 25;
    private BASE_URL = enviroment.baseUrl;

    public loadMessages$ = signal({ scrollBottom: false, loadMessages: false, conversationId: 0 } as LoadMessages);

    private socket: Socket;

    constructor(
        private messageStore: MessageSignalsStore,
        private http: HttpClient,
    ) {
        this.socket = io(this.BASE_URL);
    }

    emitLoadMessages(loadMessages: LoadMessages) {
        this.loadMessages$.set(loadMessages);
    }

    loadMoreMessages(idconversation: number): Observable<{ data: Message[] }> {
        const state = this.messageStore.getValue();

        if (!state.hasMore) return of({ data: [] });

        const nextPage = state.currentPage + 1;

        const payload = {
            page: nextPage,
            limit: this.LIMIT,
            conversation: {
                idconversation
            }
        }

        return this.http.post<{ data: Message[]; pagination: Pagination }>(`${this.BASE_URL}/messages/get`, payload)
            .pipe(
                map(response => {
                    return {
                        data: response.data.map(message => ({
                            ...message,
                            uniqueId: message.idmessage
                        })),
                        hasMore: nextPage < response.pagination.totalPages,
                    };
                }),
                tap(({ data, hasMore }) => {
                    this.messageStore.update({
                        currentPage: nextPage,
                        hasMore
                    });
                    //this.messageStore.add(data);
                    this.messageStore.set([...data, ...Object.values(this.messageStore.getValue().entities || {})]); // Clonar para asegurar detección de cambios
                })
            );

    }

    joinConversation(conversationId: number) {
        this.socket.emit('joinConversation', conversationId);
    }

    sendMessage(conversationId: number, message: string, sender: string, employeeId: number) {
        this.socket.emit('sendMessage', { conversationId, message, sender, employeeId });
    }

    // Escuchar nuevos mensajes
    employeeMessagesWS(): Observable<Message> {
        return new Observable(observer => {
            this.socket.on('newMessageEmployee', message => observer.next(message.data));
        });
    }

    clientMessagesWS(): Observable<Message> {
        return new Observable(observer => {
            this.socket.on('newMessageClient', response => observer.next(response.message.data));
        });
    }
}