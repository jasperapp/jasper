type Log = {
  id: number;
  level: 'error' | 'warning' | 'info' | 'verbose';
  createdAt: number;
  category: string;
  message: string;
  details: any;
};

class _Logger {
  private readonly logs: Log[] = [];

  error(category: string, message: string, details: any = {}) {
    this.logs.push({
      id: this.logs.length,
      level: 'error',
      createdAt: Date.now(),
      category,
      message,
      details,
    });
    console.error(category, message, details);
  }

  warning(category: string, message: string, details: any = {}) {
    this.logs.push({
      id: this.logs.length,
      level: 'warning',
      createdAt: Date.now(),
      category,
      message,
      details,
    });
    console.warn(category, message, details);
  }

  verbose(category: string, message: string, details: any = {}) {
    this.logs.push({
      id: this.logs.length,
      level: 'verbose',
      createdAt: Date.now(),
      category,
      message,
      details
    });
    console.log(category, message, details);
  }
}

export const Logger = new _Logger();
