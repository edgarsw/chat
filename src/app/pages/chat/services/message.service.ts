import { Injectable } from "@angular/core";
import { enviroment } from "../../../../environments/enviroment.qa";
import { MessageStore } from "../store/message.store";
import { HttpClient } from "@angular/common/http";
import { Message } from "../model/messages.model";
import { map, Observable, tap } from "rxjs";
import { Pagination } from "../model/pagination.model";
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class MessageService {

    private readonly LIMIT = 25;
    private BASE_URL = enviroment.baseUrl;

    private socket: Socket;

    constructor(
        private messageStore: MessageStore,
        private http: HttpClient,
    ) {
        this.socket = io(this.BASE_URL);
     }

    loadMoreMessages(idconversation: number) {
        const state = this.messageStore.getValue();

        if (!state.hasMore) return;

        const nextPage = state.currentPage + 1;

        const payload = {
            page: nextPage,
            limit: this.LIMIT,
            conversation: {
                idconversation
            }
        }

        this.http.post<{ data: Message[]; pagination: Pagination }>(`${this.BASE_URL}/messages/get`, payload)
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
            ).subscribe();

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