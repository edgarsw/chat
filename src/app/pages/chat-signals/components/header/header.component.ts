import { CommonModule } from '@angular/common';
import { Component, Input, Signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, takeUntil } from 'rxjs';
import { Client } from '../../model/client.model';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ClientSignalsQuery } from '../../store/client.query';

@Component({
  selector: 'app-header',
  imports: [CommonModule, MatIconModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Input() sidenav!: MatSidenav;

  protected selectedClient: Signal<Client | null>;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly observer: BreakpointObserver,
    private readonly clientQuery: ClientSignalsQuery,
  ) {
    this.selectedClient = this.clientQuery.selectedClient;
   }

  ngOnInit(): void {
    this.configSidebar();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private configSidebar() {
    this.observer.observe(["(max-width: 800px)"])
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        if (res.matches) {
          this.sidenav.mode = "over";
          this.sidenav.close();
        } else {
          this.sidenav.mode = "side";
          this.sidenav.open();
        }
      });
  }
}
