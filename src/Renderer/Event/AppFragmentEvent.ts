import {Event} from './Event';

enum EventNames {
  showPref = 'showPref',
  showConfigSetup = 'showConfigSetup',
}

class _AppFragmentEvent {
  private readonly event = new Event();

  // show pref
  emitShowPref() {
    this.event.emit(EventNames.showPref);
  }

  onShowPref(owner, handler: () => void) {
    this.event.on(EventNames.showPref, owner, handler);
  }

  // show config setup
  emitShowConfigSetup() {
    this.event.emit(EventNames.showConfigSetup);
  }

  onShowConfigSetup(owner, handler: () => void) {
    this.event.on(EventNames.showConfigSetup, owner, handler);
  }
}

export const AppFragmentEvent = new _AppFragmentEvent();
