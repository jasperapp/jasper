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
  private logId: number = 0;
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
    this.add('error', label, message, details);
    console.error(label, message, details);
  }

  warning(label: string, message: string, details: any = {}) {
    this.add('warning', label, message, details);
    console.warn(label, message, details);
  }

  verbose(label: string, message: string, details: any = {}) {
    this.add('verbose', label, message, details);
    console.log(label, message, details);
  }

  private add(level: Log['level'], label: string, message: string, details: any = {}) {
    const log: Log = {
      id: this.logId++,
      level,
      createdAt: Date.now(),
      label,
      message,
      details
    };
    this.logs.push(log);

    if (this.logs.length > 1000) this.logs.shift();

    this.event.emit(EventNames.NewLog, log);
  }
}

export const Logger = new _Logger();
