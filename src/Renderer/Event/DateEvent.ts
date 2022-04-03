import {Event} from '../Library/Infra/Event';

enum EventNames {
  changingDate = 'changingDate',
}

class _DateEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  emitChangingDate() {
    this.event.emit(EventNames.changingDate);
  }

  onChangingDate(owner, handler: () => void) {
    this.event.on(EventNames.changingDate, owner, handler);
  }
}

export const DateEvent = new _DateEvent();
