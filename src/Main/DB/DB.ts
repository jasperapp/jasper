import sqlite3 from 'sqlite3';
import {Config} from '../Config';

class _DB {
  private sqlite: sqlite3.Database;

  constructor() {
    this.sqlite = this.createSqlite();
  }

  private createSqlite() {
    return new sqlite3.Database(Config.databasePath);
  }

  async reloadDBPath() {
    await this.close();
    this.sqlite = this.createSqlite();
  }

  exec(sql: string, params = []): Promise<{error?: Error; insertedId?: number}> {
    return new Promise(resolve => {
      this.sqlite.run(sql, ...params, function (error) {
        // @ts-ignore
        const insertedId = this.lastID;
        error ? resolve({error}) : resolve({insertedId});
      });
    });
  }

  select(sql: string, params = [], suppressSlowQueryLog = false): Promise<{error?: Error; rows?: any[]}> {
    return new Promise(resolve => {
      const start = Date.now();
      this.sqlite.all(sql, ...params, (error, row)=>{
        error ? resolve({error}) : resolve({rows: row || []});

        const time = Date.now() - start;
        if (!suppressSlowQueryLog && time > 200) console.warn('[slow query]', `${time}ms`, sql);
      });
    });
  }

  selectSingle(sql: string, params = []): Promise<{error?: Error; row?: any}> {
    return new Promise(resolve => {
      this.sqlite.get(sql, ...params, (error, row)=>{
        error ? resolve({error}) : resolve({row});
      });
    });
  }

  close() {
    return new Promise((resolve, reject)=>{
      this.sqlite.close((error)=> error ? reject(error) : resolve());
    });
  }
}

export const DB = new _DB();
