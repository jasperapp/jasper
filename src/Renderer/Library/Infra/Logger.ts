import {Event} from './Event';

export type Log = {
  id: number;
  level: 'error' | 'warning' | 'info' | 'verbose';
  createdAt: number;
  label: string;
  message: string;
  details: any;
};

enum EventNames {
  NewLog = 'NewLog',
}

class _Logger {
  private readonly logs: Log[] = [];
  private readonly event = new Event();

  getLogs(): Log[] {
    return [...this.logs];
  }

  offAll(owner) {
    this.event.offAll(owner);
  }

  onNewLog(owner: any, handler: (log: Log) => void) {
    this.event.on(EventNames.NewLog, owner, handler);
  }

  hasError(): boolean {
    return this.logs.some(log => log.level === 'error');
  }

  error(label: string, message: string, details: any = {}) {
    const log: Log = {
      id: this.logs.length,
      level: 'error',
      createdAt: Date.now(),
      label,
      message,
      details,
    };
    this.logs.push(log);
    console.error(label, message, details);
    this.event.emit(EventNames.NewLog, log);
  }

  warning(label: string, message: string, details: any = {}) {
    const log: Log = {
      id: this.logs.length,
      level: 'warning',
      createdAt: Date.now(),
      label,
      message,
      details,
    };
    this.logs.push(log);
    console.warn(label, message, details);
    this.event.emit(EventNames.NewLog, log);
  }

  verbose(label: string, message: string, details: any = {}) {
    const log: Log = {
      id: this.logs.length,
      level: 'verbose',
      createdAt: Date.now(),
      label,
      message,
      details
    };
    this.logs.push(log);
    console.log(label, message, details);
    this.event.emit(EventNames.NewLog, log);
  }
}

export const Logger = new _Logger();
