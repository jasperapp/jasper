import sqlite3 from 'sqlite3';
import fs from 'fs';
import {BrowserWindow} from 'electron';
import {SQLiteIPC} from '../../IPC/SQLiteIPC';

class _SQLiteBind {
  private sqlite: sqlite3.Database;
  private dbPath: string;

  async bindIPC(_window: BrowserWindow) {
    SQLiteIPC.onInit(async (_ev, dbPath) => this.init(dbPath));
    SQLiteIPC.onExec(async (_ev, {sql, params}) => this.exec(sql, params));
    SQLiteIPC.onSelect(async (_ev, {sql, params}) => this.select(sql, params));
    SQLiteIPC.onSelectSingle(async (_ev, {sql, params}) => this.selectSingle(sql, params));
    SQLiteIPC.onDeleteDBFile(async () => await this.deleteDBFile());
  }

  private async init(dbPath: string): Promise<{error?: Error}> {
    await this.close();
    this.dbPath = dbPath;
    this.sqlite = new sqlite3.Database(dbPath);

    // DBが壊れていないかのチェック
    const res = await this.select('select * from sqlite_master limit 1');
    if (res.error) {
      console.error(res.error);
      return {error: res.error};
    }

    return {};
  }

  async exec(sql: string, params = []): Promise<{error?: Error; insertedId?: number}> {
    return new Promise(resolve => {
      this.sqlite.run(sql, ...params, function (error) {
        // @ts-ignore
        const insertedId = this?.lastID;
        error ? resolve({error}) : resolve({insertedId});
      });
    });
  }

  private async select(sql: string, params = []): Promise<{error?: Error; rows?: any[]}> {
    return new Promise(resolve => {
      this.sqlite.all(sql, ...params, (error, row)=>{
        error ? resolve({error}) : resolve({rows: row || []});
      });
    });
  }

  async selectSingle(sql: string, params = []): Promise<{error?: Error; row?: any}> {
    return new Promise(resolve => {
      this.sqlite.get(sql, ...params, (error, row)=>{
        error ? resolve({error}) : resolve({row});
      });
    });
  }

  private async close() {
    if (!this.sqlite) return;

    return new Promise<void>((resolve, reject) => {
      this.sqlite.close((error) => error ? reject(error) : resolve());
    });
  }

  private async delete() {
    await this.close();
    fs.unlinkSync(this.dbPath);
    this.sqlite = null;
    this.dbPath = null;
  }

  private async deleteDBFile() {
    await this.close();
    fs.renameSync(this.dbPath, `${this.dbPath}.deleted-${Date.now()}.db`);
    this.sqlite = null;
    this.dbPath = null;
  }
}

export const SQLiteBind = new _SQLiteBind();
