import {Event} from '../Library/Infra/Event';

enum EventNames {
  UpdatePref = 'UpdatePref',
  SwitchPref = 'SwitchPref',
}

class _UserPrefEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // update pref
  emitUpdatePref() {
    this.event.emit(EventNames.UpdatePref);
  }

  onUpdatePref(owner, handler: () => void) {
    return this.event.on(EventNames.UpdatePref, owner, handler);
  }

  // switch pref
  emitSwitchPref() {
    this.event.emit(EventNames.SwitchPref);
  }

  onSwitchPref(owner, handler: () => void) {
    return this.event.on(EventNames.SwitchPref, owner, handler);
  }
}

export const UserPrefEvent = new _UserPrefEvent();
