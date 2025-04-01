import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClientSignalsQuery } from '../../store/client.query';
import { filter, Subject, takeUntil, tap } from 'rxjs';
import { Client } from '../../model/client.model';
import { MatInputModule } from '@angular/material/input';
import { MessageSignalsService } from '../../services/message.service';

@Component({
  selector: 'app-message-form',
  imports: [FormsModule, MatInputModule, MatFormFieldModule, ReactiveFormsModule],
  templateUrl: './message-form.component.html',
  styleUrl: './message-form.component.scss'
})
export class MessageFormComponent {

  protected formGroup: FormGroup | undefined;

  private destroy$ = new Subject<void>();

  private selectedClientValue: Client | undefined;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly messageService: MessageSignalsService,
    private readonly clientQuery: ClientSignalsQuery,
  ) { }

  ngOnInit(): void {
    this.createForm();
    this.getClient();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getClient() {
    this.selectedClientValue = this.clientQuery.selectedClient()!;
  }

  createForm() {
    this.formGroup = this.formBuilder.group({
      message: [''],
    });
  }

  fieldNoValid(campo: string) {
    return this.formGroup?.get(campo)?.invalid && this.formGroup?.get(campo)?.touched
  }

  sendMessage() {
    if (this.formGroup?.get('message')?.value.trim()) {
      this.messageService.sendMessage(this.getConversationId()!, this.formGroup?.get('message')?.value.trim(), 'empleado', 1);
      this.formGroup?.get('message')?.setValue('');
      this.clientQuery.moveClientToTop(this.selectedClientValue?.idclient!);
      this.clientsScrollToTop();
    }
  }

  clientsScrollToTop() {
    setTimeout(() => {
      const clientsArea = document.querySelector('.scroll-container') as HTMLElement;
      if (clientsArea) {
        clientsArea.scrollTop = 0;
      }
    }, 100);
  }

  private getConversationId(): number | undefined {
    return this.selectedClientValue?.conversations[0].idconversation;
  }

}
