import {VersionType} from '../Repository/VersionRepo';
import {Event} from './Event';

enum EventNames {
  newVersion = 'newVersion',
}

class _VersionEvent {
  private readonly event = new Event();

  emitNewVersion(newVersion: VersionType) {
    this.event.emit(EventNames.newVersion, newVersion);
  }

  onNewVersion(owner, handler: (newVersion: VersionType) => void) {
    this.event.on(EventNames.newVersion, owner, handler);
  }
}

export const VersionEvent = new _VersionEvent();
