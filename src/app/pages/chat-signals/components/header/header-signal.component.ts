import { Component, Input, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { filter, Observable, Subject, takeUntil } from 'rxjs';
import { Client } from '../../model/client.model';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { ClientSignalService } from '../../services/client-signal.service';

@Component({
  selector: 'app-header-signal',
  imports: [CommonModule, MatIconModule, MatSidenavModule, MatToolbarModule],
  templateUrl: './header-signal.component.html',
  styleUrl: './header-signal.component.scss'
})
export class HeaderSignalComponent {

  @Input() sidenav!: MatSidenav;

  @Input() selectedClient$?: Observable<Client | undefined>;

  private destroy$ = new Subject<void>();

  constructor(
    private readonly observer: BreakpointObserver,
    private readonly clientService: ClientSignalService,
  ) { }

  ngOnInit(): void {
    this.configSidebar();
    this.getClient();
  }

  getClient(){
   this.selectedClient$ = this.clientService.currentClient$.pipe(
     filter((client): client is Client => client !== undefined)
   );
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

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



}
