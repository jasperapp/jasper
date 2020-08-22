import React from 'react';

type HandlerData = {
  eventName: string;
  handler: (...args) => void;
  owner: React.Component;
}

export class Event {
  private handler: HandlerData[] = [];
  private readonly emittingEventNames: string[] = [];

  async emit(eventName: string, ...args) {
    if (this.emittingEventNames.includes(eventName)) {
      console.log(`prevent event: ${eventName}`);
      return;
    }

    this.emittingEventNames.push(eventName);

    const handlers = this.handler.filter(v => v.eventName === eventName);
    for (const handler of handlers) {
      await handler.handler(...args);
    }

    const index = this.emittingEventNames.findIndex(v => v === eventName);
    this.emittingEventNames.splice(index, 1);
  }

  on(eventName: string, owner: HandlerData['owner'], handler: HandlerData['handler']) {
    this.handler.push({eventName, owner, handler});
  }

  offAll(owner: HandlerData['owner']) {
    this.handler = this.handler.filter(v => v.owner !== owner);
  }
}
