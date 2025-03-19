import { Conversation } from "./conversation.model";
import { Employee } from "./employee.model";

export interface Message {
    idmessage:    number;
    mensaje:      string;
    isleido:      number;
    isrespondido: number;
    fecha:        Date;
    hora:         string;
    enviadoPor:   string;
    created_at:   Date;
    conversation: Conversation;
    employee:     Employee;
}