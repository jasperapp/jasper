import {Event} from './Event';

enum EventNames {
  scroll = 'scroll',
}

class _WebViewEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // scroll
  emitScroll(direction: -1 | 1) {
    this.event.emit(EventNames.scroll, direction);
  }

  onScroll(owner, handler: (direction: -1 | 1) => void) {
    this.event.on(EventNames.scroll, owner, handler);
  }
}

export const WebViewEvent = new _WebViewEvent();
