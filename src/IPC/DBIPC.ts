import {ipcMain, ipcRenderer} from 'electron';

enum ChannelNames {
  exec = 'exec',
  select = 'select',
  selectSingle = 'selectSingle',
}

type SQLParams = {
  sql: string;
  params: Array<string|number|boolean>;
}

type SQLReturn = {
  row?: any;
  rows?: any[];
  insertedId?: number;
  error?: Error;
};

class _DBIPC {
  // exec
  async exec(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLReturn> {
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.exec, p);
  }

  onExec(handler: (_ev, params: SQLParams) => Promise<SQLReturn>) {
    ipcMain.handle(ChannelNames.exec, handler);
  }

  // select
  async select(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLReturn> {
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.select, p);
  }

  onSelect(handler: (_ev, params: SQLParams) => Promise<SQLReturn>) {
    ipcMain.handle(ChannelNames.select, handler);
  }

  // selectSingle
  async selectSingle(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLReturn> {
    const p: SQLParams = {sql, params};
    return ipcRenderer.invoke(ChannelNames.selectSingle, p);
  }

  onSelectSingle(handler: (_ev, params: SQLParams) => Promise<SQLReturn>) {
    ipcMain.handle(ChannelNames.selectSingle, handler);
  }
}

export const DBIPC = new _DBIPC();
