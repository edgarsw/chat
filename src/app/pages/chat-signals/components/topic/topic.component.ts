import { CommonModule } from '@angular/common';
import { Component, Signal } from '@angular/core';
import { ClientSignalsQuery } from '../../store/client.query';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { Client } from '../../model/client.model';

@Component({
  selector: 'app-topic',
  imports: [CommonModule],
  templateUrl: './topic.component.html',
  styleUrl: './topic.component.scss'
})
export class TopicComponent {

  protected selectedClient: Signal<Client | null>;

  constructor(
    private readonly clientQuery: ClientSignalsQuery
  ) { 
    this.selectedClient = this.clientQuery.selectedClient;
  }
}
