import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-sidenav',
  imports: [],
  templateUrl: './header-sidenav.component.html',
  styleUrl: './header-sidenav.component.scss'
})
export class HeaderSidenavComponent {

  @Input() numClientsMessages!: number;
}
