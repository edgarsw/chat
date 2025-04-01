import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, Signal, WritableSignal } from '@angular/core';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { ClientSignalsQuery } from '../../store/client.query';
import { MessageSignalsQuery } from '../../store/message.query';
import { MatListModule } from '@angular/material/list';
import { ClientStatus } from '../../enum/client.status.enum';
import { ClientSignalsService } from '../../services/client.service';
import { MessageSignalsService } from '../../services/message.service';

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

  protected clients: Signal<Client[]>;
  private firstClient: Signal<Client | null>;

  constructor(
    private readonly clientService: ClientSignalsService,
    private readonly clientQuery: ClientSignalsQuery,
    private readonly messageService: MessageSignalsService,
    private readonly messageQuery: MessageSignalsQuery,
  ) {
    this.clients = this.clientQuery.clients;
    this.firstClient = this.clientQuery.firstClient;
  }

  ngOnInit(): void {
    this.getFirstClient();
  }

  private getFirstClient() {
    this.clientService.loadMoreClients()?.pipe(
      take(1),
      tap(() => {
        if (!this.firstClient() || !this.firstClient()?.conversations?.length) return;

        if (!this.selectedClientValue || this.selectedClientValue.idclient !== this.firstClient()?.idclient) {
          this.selectedClientValue = JSON.parse(JSON.stringify(this.firstClient()));
          this.clientQuery.updateClientStatus(this.firstClient()?.idclient!, ClientStatus.SELECTED);
          this.messageService.joinConversation(this.getConversationId()!);
          this.messageService.emitLoadMessages({ scrollBottom: false, loadMessages: true, conversationId: this.firstClient()?.conversations[0]?.idconversation! });
        }
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

    const client = this.clientQuery.selectClientById(id)();
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
  }

  private getConversationId(): number | undefined {
    return this.selectedClientValue?.conversations[0].idconversation;
  }
}
