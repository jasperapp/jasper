import {Event} from '../Library/Infra/Event';
import {StreamEntity} from '../Library/Type/StreamEntity';

const EventNames = {
  OpenProjectBoard: 'OpenProjectBoard',
};

class _BrowserEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // open project board
  async emitOpenProjectBoard(projectStream: StreamEntity) {
    return this.event.emit(EventNames.OpenProjectBoard, projectStream);
  }

  onOpenProjectBoard(owner: any, handler: (projectStrem: StreamEntity) => void) {
    this.event.on(EventNames.OpenProjectBoard, owner, handler);
  }
}

export const BrowserEvent = new _BrowserEvent();
