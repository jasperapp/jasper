import {ipcMain, ipcRenderer} from 'electron';

enum ChannelNames {
  exec = 'DBIPC:exec',
  select = 'DBIPC:select',
  selectSingle = 'DBIPC:selectSingle',
  init = 'DBIPC:init'
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

class _DBIPC {
  private log: boolean = false;

  // exec
  async exec(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRunReturn> {
    if (this.log) console.log(sql, params);
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.exec, p);
  }

  onExec(handler: (_ev, params: SQLParams) => Promise<SQLRunReturn>) {
    ipcMain.handle(ChannelNames.exec, handler);
  }

  // select
  async select<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowsReturn<T>> {
    if (this.log) console.log(sql, params);
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.select, p);
  }

  onSelect(handler: (_ev, params: SQLParams) => Promise<SQLRowsReturn<any>>) {
    ipcMain.handle(ChannelNames.select, handler);
  }

  // selectSingle
  async selectSingle<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowReturn<T>> {
    if (this.log) console.log(sql, params);
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.selectSingle, p);
  }

  onSelectSingle(handler: (_ev, params: SQLParams) => Promise<SQLRowReturn<any>>) {
    ipcMain.handle(ChannelNames.selectSingle, handler);
  }

  // init
  async init(configIndex: number): Promise<void> {
    return ipcRenderer.invoke(ChannelNames.init, configIndex);
  }

  onInit(handler: (_ev, configIndex: number) => Promise<void>) {
    ipcMain.handle(ChannelNames.init, handler);
  }
}

export const DBIPC = new _DBIPC();
