type HandlerData = {
  eventName: string;
  handler: (...args) => void;
  owner: any;
}

export class Event {
  private handler: HandlerData[] = [];

  async emit(eventName: string, ...args) {
    const handlers = this.handler.filter(v => v.eventName === eventName);
    for (const handler of handlers) {
      handler.handler(...args);
    }
  }

  on(eventName: string, owner: HandlerData['owner'], handler: HandlerData['handler']) {
    this.handler.push({eventName, owner, handler});
  }

  off(eventName: string, owner: HandlerData['owner']) {
    this.handler = this.handler.filter(v => v.eventName !== eventName || v.owner !== owner);
  }

  offAll(owner: HandlerData['owner']) {
    this.handler = this.handler.filter(v => v.owner !== owner);
  }
}
