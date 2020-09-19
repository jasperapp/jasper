import {ipcMain, ipcRenderer} from 'electron';

enum ChannelNames {
  exec = 'DBIPC:exec',
  select = 'DBIPC:select',
  selectSingle = 'DBIPC:selectSingle',
  init = 'DBIPC:init',
  deleteDBFile = 'DBIPC:deleteDBFile',
}

type SQLParams = {
  sql: string;
  params: Array<string|number|boolean>;
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
  // exec
  async exec(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRunReturn> {
    const p: SQLParams = {sql, params};
    return await ipcRenderer.invoke(ChannelNames.exec, p);
  }

  onExec(handler: (_ev, params: SQLParams) => Promise<SQLRunReturn>) {
    ipcMain.handle(ChannelNames.exec, handler);
  }

  // select
  async select<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowsReturn<T>> {
    const p: SQLParams = {sql, params};
    return await ipcRenderer.invoke(ChannelNames.select, p);
  }

  onSelect(handler: (_ev, params: SQLParams) => Promise<SQLRowsReturn<any>>) {
    ipcMain.handle(ChannelNames.select, handler);
  }

  // selectSingle
  async selectSingle<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowReturn<T>> {
    const p: SQLParams = {sql, params};
    return await ipcRenderer.invoke(ChannelNames.selectSingle, p);
  }

  onSelectSingle(handler: (_ev, params: SQLParams) => Promise<SQLRowReturn<any>>) {
    ipcMain.handle(ChannelNames.selectSingle, handler);
  }

  // init
  async init(dbPath: string): Promise<{error?: Error}> {
    return ipcRenderer.invoke(ChannelNames.init, dbPath);
  }

  onInit(handler: (_ev, dbPath: string) => Promise<{error?: Error}>) {
    ipcMain.handle(ChannelNames.init, handler);
  }

  // delete db file
  async deleteDBFile(): Promise<void> {
    return ipcRenderer.invoke(ChannelNames.deleteDBFile);
  }

  onDeleteDBFile(handler: () => Promise<void>) {
    ipcMain.handle(ChannelNames.deleteDBFile, handler);
  }
}

export const SQLiteIPC = new _SQLiteIPC();
