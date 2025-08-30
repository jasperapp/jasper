class _DB {
  async init(dbPath: string): Promise<{error?: Error}> {
    return await window.ipc.sqlite.init(dbPath);
  }

  async exec(sql: string, params = []): Promise<{error?: Error; insertedId?: number}> {
    const t = Date.now();
    const res = await window.ipc.sqlite.exec(sql, params);
    this.showLog(t, sql, params);
    return res;
  }

  async select<T = {}>(sql: string, params = []): Promise<{error?: Error; rows?: T[]}> {
    const t = Date.now();
    const res = await window.ipc.sqlite.select<T>(sql, params);
    this.showLog(t, sql, params);
    return res;
  }

  async selectSingle<T = {}>(sql: string, params = []): Promise<{error?: Error; row?: T}> {
    const t = Date.now();
    const res = await window.ipc.sqlite.selectSingle<T>(sql, params);
    this.showLog(t, sql, params);
    return res;
  }

  async deleteDBFile() {
    return window.ipc.sqlite.deleteDBFile();
  }

  private showLog(startTime: number, sql: string, params: any[]) {
    const time = Date.now() - startTime;
    if (time > 300) {
      console.warn(`slow query ${time}ms`, sql, params);
      // } else if (process.env.JASPER === 'DEV') {
      //   console.debug(`time ${time}ms`, sql, params);
    }
  }
}

export const DB = new _DB();
