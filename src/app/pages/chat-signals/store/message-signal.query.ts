
import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { MessageSignalState, MessageSignalStore } from './message-signal.store';


@Injectable({ providedIn: 'root' })
export class MessageSignalQuery extends QueryEntity<MessageSignalState> {
  constructor(protected override store: MessageSignalStore) {
    super(store);
  }
  

  resetToDefaul(){
    this.store.reset();
  }
}

