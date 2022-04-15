type Log = {
  id: number;
  level: 'error' | 'verbose';
  createdAt: number;
  category: string;
  message: string;
  content: any;
};

class _Logger {
  private readonly logs: Log[] = [];

  error(category: string, message: string, error?: Error) {
    this.logs.push({
      id: this.logs.length,
      level: 'error',
      createdAt: Date.now(),
      category,
      message,
      content: error ?? {}
    });
    console.error(error);
  }

  verbose(category: string, message: string, content: any = {}) {
    this.logs.push({
      id: this.logs.length,
      level: 'verbose',
      createdAt: Date.now(),
      category,
      message,
      content
    });
    console.log(category, message, content);
  }
}

export const Logger = new _Logger();
