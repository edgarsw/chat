import { Conversation } from "./conversation.model";

export interface Client {
    uniqueId?: number;
    idclient: number;
    whatsapp_telefono: string;
    mostrar_telefono: string;
    isSuscrito: number;
    fecharegistro: Date;
    fechamensaje: Date;
    nombre_cliente: string;
    conversations: Conversation[];
    statusui?: string;
    sentMessage?: boolean;
}

