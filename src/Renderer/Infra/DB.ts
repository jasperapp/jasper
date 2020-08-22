import {SQLiteIPC} from '../../IPC/SQLiteIPC';

class _DB {
  async init(dbPath: string) {
    await SQLiteIPC.init(dbPath);
  }

  async exec(sql: string, params = []): Promise<{error?: Error; insertedId?: number}> {
    const t = Date.now();
    const res = await SQLiteIPC.exec(sql, params);
    this.showLog(t, sql, params);
    return res;
  }

  async select<T>(sql: string, params = []): Promise<{error?: Error; rows?: T[]}> {
    const t = Date.now();
    const res = await SQLiteIPC.select<T>(sql, params);
    this.showLog(t, sql, params);
    return res;
  }

  async selectSingle<T>(sql: string, params = []): Promise<{error?: Error; row?: T}> {
    const t = Date.now();
    const res = await SQLiteIPC.selectSingle<T>(sql, params);
    this.showLog(t, sql, params);
    return res;
  }

  private showLog(startTime: number, sql: string, params: any[]) {
    const isDev = process.env.JASPER === 'DEV';
    if (!isDev) return;

    const time = Date.now() - startTime;
    if (time > 33) {
      console.debug(`<span style="color: red">slow query ${time}</span>`, sql, params);
    } else {
      console.debug(time, sql, params);
    }
  }
}

export const DB = new _DB();
