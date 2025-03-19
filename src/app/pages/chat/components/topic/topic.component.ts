import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ClientQuery } from '../../store/client.query';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { Client } from '../../model/client.model';

@Component({
  selector: 'app-topic',
  imports: [CommonModule],
  templateUrl: './topic.component.html',
  styleUrl: './topic.component.scss'
})
export class TopicComponent {

  protected selectedClient$!: Observable<Client | undefined>;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly clientQuery: ClientQuery
  ) { }

  ngOnInit(): void {
    this.getClient();
  }

  getClient() {
    this.selectedClient$ = this.clientQuery.selectedClient()
      .pipe(
        takeUntil(this.destroy$),
        filter((client) => !!client),
      );
  }
}
