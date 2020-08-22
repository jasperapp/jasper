import {Event} from '../Library/Infra/Event';
import {RemoteVersionEntity} from '../Library/Type/RemoteVersionEntity';

enum EventNames {
  newVersion = 'newVersion',
}

class _VersionEvent {
  private readonly event = new Event();

  emitNewVersion(newVersion: RemoteVersionEntity) {
    this.event.emit(EventNames.newVersion, newVersion);
  }

  onNewVersion(owner, handler: (newVersion: RemoteVersionEntity) => void) {
    this.event.on(EventNames.newVersion, owner, handler);
  }
}

export const VersionEvent = new _VersionEvent();
