import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { ClientQuery } from '../../store/client.query';
import { MessageQuery } from '../../store/message.query';
import { MatListModule } from '@angular/material/list';
import { ClientStatus } from '../../enum/client.status.enum';
import { ClientService } from '../../services/client.service';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-clients',
  imports: [CommonModule, MatListModule, MatSidenavModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss'
})
export class ClientsComponent {
  @Input() sidenav!: MatSidenav;

  @Output() imitSelectedClient = new EventEmitter<any>();
  protected selectedClientValue: Client | undefined;

  protected clients$: Observable<Client[]> | undefined;

  constructor(
    private readonly clientService: ClientService,
    private readonly clientQuery: ClientQuery,
    private readonly messageService: MessageService,
    private readonly messageQuery: MessageQuery,
  ) { }

  ngOnInit(): void {
    this.getFirstClient();
  }

  ngAfterViewInit() {
    this.clients$ = this.clientQuery.selectAll().pipe(map((clients: any[]) => [...clients]));
  }

  private getFirstClient() {
      this.clientService.loadMoreClients()?.pipe(
        take(1),
        switchMap(() => {
          const selectedClient$ = this.clientQuery.selectFirstClient()
            .pipe(
              tap((client) => {
                if (!client || !client.conversations?.length) return;
  
                if (!this.selectedClientValue || this.selectedClientValue.idclient !== client.idclient) {
                  this.selectedClientValue = JSON.parse(JSON.stringify(client));
                  this.clientQuery.updateClientStatus(client.idclient, ClientStatus.SELECTED);
                  this.messageService.joinConversation(this.getConversationId()!);
                  this.messageService.emitLoadMessages({scrollBottom: false, loadMessages: true, conversationId: client?.conversations[0]?.idconversation});
                }
              }),
              take(1)
            );
          return selectedClient$;
        }),
        catchError((error) => {
          console.error('Error loading more clients:', error);
          return of(null);
        }),
      ).subscribe();
    }

  private getClients() {
    this.clientService.loadMoreClients()?.pipe(
      take(1),
      catchError((error) => {
        console.error('Error loading more clients:', error);
        return of(null);
      }),
    ).subscribe();
  }

  onScrollClients(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop === target.clientHeight) {
      this.getClients(); // Cargar más datos al llegar al final
    }
  }

  onSelectClient(id: number) {
    this.sidenav.mode === 'over' && this.sidenav.toggle();

    if (this.selectedClientValue?.idclient === id) return; // Si el cliente ya está seleccionado, no hacer nada

    this.clientQuery.selectClientById(id).pipe(
      take(1),
      tap((client) => {
        if (!client || !client.conversations?.length) return;

        const conversationId = client.conversations[0].idconversation;

        // Solo llamar a loadMoreMessages si el cliente cambió
        if (!this.selectedClientValue || this.selectedClientValue.idclient !== client.idclient) {
          this.selectedClientValue = JSON.parse(JSON.stringify(client));
          this.clientQuery.changeClientStatus(client.idclient);
          this.clientQuery.updateClientSentMessage(client.idclient, false);
          this.messageService.joinConversation(this.getConversationId()!);
          this.messageQuery.resetToDefault();
          const message = {
            idclient: client.idclient,
            conversationId
          }
          this.imitSelectedClient.emit(message);
        }
      })
    ).subscribe();
  }

  private getConversationId(): number | undefined {
    return this.selectedClientValue?.conversations[0].idconversation;
  }
}
