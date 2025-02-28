import { Injectable } from "@angular/core";
import { enviroment } from "../../../../environments/enviroment.qa";
import { MessageStore } from "../store/message.store";
import { HttpClient } from "@angular/common/http";
import { Message } from "../model/messages.model";
import { map, tap } from "rxjs";
import { Pagination } from "../model/pagination.model";
import { NonNullableFormBuilder } from "@angular/forms";

@Injectable({ providedIn: 'root' })
export class MessageService {

    private readonly LIMIT = 15;
    private BASE_URL = enviroment.baseUrl;

    constructor(
        private messageStore: MessageStore,
        private http: HttpClient,
    ) { }

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
                    this.messageStore.add(data);
                })
            ).subscribe();

    }
}