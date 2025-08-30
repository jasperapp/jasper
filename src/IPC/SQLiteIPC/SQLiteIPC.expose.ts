import {ipcRenderer} from 'electron';
import {SQLiteIPCChannel} from './SQLiteIPC.channel';

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

declare global {
  interface IPC {
    sqlite: {
      init: (dbPath: string) => Promise<{error?: Error}>;
      exec: (sql: SQLParams['sql'], params?: SQLParams['params']) => Promise<SQLRunReturn>;
      select: <T>(sql: SQLParams['sql'], params?: SQLParams['params']) => Promise<SQLRowsReturn<T>>;
      selectSingle: <T>(sql: SQLParams['sql'], params?: SQLParams['params']) => Promise<SQLRowReturn<T>>;
      deleteDBFile: () => Promise<void>;
    },
  }
}

export const SQLiteIPCExpose = {
  ipc: {
    sqlite: {
      init: (dbPath: string) => {
        return ipcRenderer.invoke(SQLiteIPCChannel.init, dbPath);
      },

      exec: (sql: SQLParams['sql'], params?: SQLParams['params']) => {
        const p: SQLParams = {sql, params};
        return ipcRenderer.invoke(SQLiteIPCChannel.exec, p);
      },

      select: (sql: SQLParams['sql'], params?: SQLParams['params']) => {
        const p: SQLParams = {sql, params};
        return ipcRenderer.invoke(SQLiteIPCChannel.select, p);
      },

      selectSingle: (sql: SQLParams['sql'], params?: SQLParams['params']) => {
        const p: SQLParams = {sql, params};
        return ipcRenderer.invoke(SQLiteIPCChannel.selectSingle, p);
      },

      deleteDBFile: () => {
        return ipcRenderer.invoke(SQLiteIPCChannel.deleteDBFile);
      }
    },
  },
}
