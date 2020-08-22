import {Event} from './Event';

enum EventNames {
  RestartAllStreams = 'RestartAllStreams',
}

class _SystemStreamEvent {
  private readonly event = new Event();

  offAll(owner) {
    this.event.offAll(owner);
  }

  // restart all streams
  emitRestartAllStreams() {
    this.event.emit(EventNames.RestartAllStreams);
  }

  onRestartAllStreams(owner, handler) {
    return this.event.on(EventNames.RestartAllStreams, owner, handler);
  }
}

export const SystemStreamEvent = new _SystemStreamEvent();
