import { Routes } from "@angular/router";
import { ChatSignalComponent } from "./components/chat/chat-signal.component";

export const routes: Routes = [
    { path: '', component: ChatSignalComponent },
    { path: '**', redirectTo: '' }
];