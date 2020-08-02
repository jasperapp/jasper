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
  // exec
  async exec(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRunReturn> {
    const p: SQLParams = {sql, params};
    const t = Date.now();
    const res = await ipcRenderer.invoke(ChannelNames.exec, p);
    this.showLog(t, sql, params);
    return res;
  }

  onExec(handler: (_ev, params: SQLParams) => Promise<SQLRunReturn>) {
    ipcMain.handle(ChannelNames.exec, handler);
  }

  // select
  async select<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowsReturn<T>> {
    const p: SQLParams = {sql, params};
    const t = Date.now();
    const res = await ipcRenderer.invoke(ChannelNames.select, p);
    this.showLog(t, sql, params);
    return res;
  }

  onSelect(handler: (_ev, params: SQLParams) => Promise<SQLRowsReturn<any>>) {
    ipcMain.handle(ChannelNames.select, handler);
  }

  // selectSingle
  async selectSingle<T = any>(sql: SQLParams['sql'], params?: SQLParams['params']): Promise<SQLRowReturn<T>> {
    const p: SQLParams = {sql, params};
    const t = Date.now();
    const res = await ipcRenderer.invoke(ChannelNames.selectSingle, p);
    this.showLog(t, sql, params);
    return res;
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

  private showLog(startTime: number, sql: SQLParams['sql'], params: SQLParams['params']) {
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

export const DBIPC = new _DBIPC();
