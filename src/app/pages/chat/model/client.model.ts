export interface Client {
    idclient:          number;
    whatsapp_telefono: string;
    mostrar_telefono:  string;
    isSuscrito:        number;
    fecharegistro:     Date;
    fechamensaje:      Date;
    nombre_cliente:    string;
    conversations:     Conversation[];
}

export interface Conversation {
    idconversation: number;
    tema:           string;
    created_at:     Date;
    closed_at:      null;
    isactiva:       number;
    estatus:        string;
}