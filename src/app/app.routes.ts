import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'chat',
        loadChildren: () => import('./pages/chat/chat.routes').then(m => m.routes)
    },
    {
        path: 'chat-signal',
        loadChildren: () => import('./pages/chat-signals/chat-signals.routes').then(m => m.routes)
    },
    {
        path: '**', redirectTo: 'chat', pathMatch: 'full'
    }
];
