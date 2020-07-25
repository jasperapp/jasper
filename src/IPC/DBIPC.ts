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

type SQLRowsReturn = {
  rows?: any[];
  error?: Error;
};

type SQLRowReturn = {
  row?: any;
  error?: Error;
};

class _DBIPC {
  // exec
  async exec(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRunReturn> {
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.exec, p);
  }

  onExec(handler: (_ev, params: SQLParams) => Promise<SQLRunReturn>) {
    ipcMain.handle(ChannelNames.exec, handler);
  }

  // select
  async select(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowsReturn> {
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.select, p);
  }

  onSelect(handler: (_ev, params: SQLParams) => Promise<SQLRowsReturn>) {
    ipcMain.handle(ChannelNames.select, handler);
  }

  // selectSingle
  async selectSingle(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowReturn> {
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.selectSingle, p);
  }

  onSelectSingle(handler: (_ev, params: SQLParams) => Promise<SQLRowReturn>) {
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
