import {Event} from '../Library/Infra/Event';

enum EventNames {
  ChangedLayout = 'ChangedLayout',
  NextLayout = 'NextLayout',
}

class _AppEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // changed layout
  emitChangedLayout() {
    this.event.emit(EventNames.ChangedLayout);
  }

  onChangedLayout(owner, handler: () => void) {
    return this.event.on(EventNames.ChangedLayout, owner, handler);
  }

  // next layout
  emitNextLayout() {
    this.event.emit(EventNames.NextLayout);
  }

  onNextLayout(owner, handler: () => void) {
    return this.event.on(EventNames.NextLayout, owner, handler);
  }
}

export const AppEvent = new _AppEvent();
