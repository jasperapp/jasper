import {Event} from './Event';

enum EventNames {
  CreateAccount = 'CreateAccount',
}

class _AccountEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // create account
  emitCreateAccount() {
    this.event.emit(EventNames.CreateAccount);
  }

  onCreateAccount(owner, handler) {
    this.event.on(EventNames.CreateAccount, owner, handler);
  }
}

export const AccountEvent = new _AccountEvent();
