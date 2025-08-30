import {ipcMain} from 'electron';
import {SQLiteService} from '../../Main/Service/SQLiteService';
import {SQLiteIPCChannel} from './SQLiteIPC.channel';

export function SQLiteIPCBind() {
  ipcMain.handle(SQLiteIPCChannel.init, (_e, dbPath: string) => {
    return SQLiteService.init(dbPath);
  });

  ipcMain.handle(SQLiteIPCChannel.exec, (_e, {sql, params}) => {
    return SQLiteService.exec(sql, params);
  });

  ipcMain.handle(SQLiteIPCChannel.select, (_e, {sql, params}) => {
    return SQLiteService.select(sql, params);
  });

  ipcMain.handle(SQLiteIPCChannel.selectSingle, (_e, {sql, params}) => {
    return SQLiteService.selectSingle(sql, params);
  });

  ipcMain.handle(SQLiteIPCChannel.deleteDBFile, (_e) => {
    return SQLiteService.deleteDBFile();
  });
}
