
import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { MessageSignalsState, MessageSignalsStore } from './message.store';


@Injectable({ providedIn: 'root' })
export class MessageSignalsQuery extends QueryEntity<MessageSignalsState> {
  constructor(protected override store: MessageSignalsStore) {
    super(store);
  }
  

  resetToDefault(){
    this.store.reset();
  }
}

