import sqlite3 from 'sqlite3';

class _SQLiteBind {
  private sqlite: sqlite3.Database;

  async init(dbPath: string) {
    await this.close();
    this.sqlite = new sqlite3.Database(dbPath);
  }

  async exec(sql: string, params = []): Promise<{error?: Error; insertedId?: number}> {
    return new Promise(resolve => {
      this.sqlite.run(sql, ...params, function (error) {
        // @ts-ignore
        const insertedId = this.lastID;
        error ? resolve({error}) : resolve({insertedId});
      });
    });
  }

  async select(sql: string, params = []): Promise<{error?: Error; rows?: any[]}> {
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

  async close() {
    if (!this.sqlite) return;

    return new Promise((resolve, reject)=>{
      this.sqlite.close((error)=> error ? reject(error) : resolve());
    });
  }
}

export const SQLiteBind = new _SQLiteBind();
