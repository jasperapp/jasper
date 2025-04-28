import { ipcMain, ipcRenderer } from 'electron';

enum ChannelNames {
  exec = 'DBIPC:exec',
  select = 'DBIPC:select',
  selectSingle = 'DBIPC:selectSingle',
  init = 'DBIPC:init',
  deleteDBFile = 'DBIPC:deleteDBFile',
}

type SQLParams = {
  sql: string;
  params: Array<string | number | boolean>;
}

type SQLRunReturn = {
  insertedId?: number;
  error?: Error;
}

type SQLRowsReturn<T> = {
  rows?: T[];
  error?: Error;
};

type SQLRowReturn<T> = {
  row?: T;
  error?: Error;
};

class _SQLiteIPC {
  private async invoke<T>(channel: ChannelNames, params?: any): Promise<T> {
    return await ipcRenderer.invoke(channel, params);
  }

  private handle(channel: ChannelNames, handler: (...args: any[]) => Promise<any>) {
    ipcMain.handle(channel, handler);
  }

  // exec
  async exec(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRunReturn> {
    return this.invoke<SQLRunReturn>(ChannelNames.exec, { sql, params });
  }

  onExec(handler: (_ev, params: SQLParams) => Promise<SQLRunReturn>) {
    this.handle(ChannelNames.exec, handler);
  }

  // select
  async select<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowsReturn<T>> {
    return this.invoke<SQLRowsReturn<T>>(ChannelNames.select, { sql, params });
  }

  onSelect(handler: (_ev, params: SQLParams) => Promise<SQLRowsReturn<any>>) {
    this.handle(ChannelNames.select, handler);
  }

  // selectSingle
  async selectSingle<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowReturn<T>> {
    return this.invoke<SQLRowReturn<T>>(ChannelNames.selectSingle, { sql, params });
  }

  onSelectSingle(handler: (_ev, params: SQLParams) => Promise<SQLRowReturn<any>>) {
    this.handle(ChannelNames.selectSingle, handler);
  }

  // init
  async init(dbPath: string): Promise<{ error?: Error }> {
    return this.invoke<{ error?: Error }>(ChannelNames.init, dbPath);
  }

  onInit(handler: (_ev, dbPath: string) => Promise<{ error?: Error }>) {
    this.handle(ChannelNames.init, handler);
  }

  // delete db file
  async deleteDBFile(): Promise<void> {
    return this.invoke<void>(ChannelNames.deleteDBFile);
  }

  onDeleteDBFile(handler: () => Promise<void>) {
    this.handle(ChannelNames.deleteDBFile, handler);
  }
}

export const SQLiteIPC = new _SQLiteIPC();
