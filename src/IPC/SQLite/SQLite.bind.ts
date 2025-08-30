import {ipcMain} from 'electron';
import {SQLiteService} from '../../Main/Service/SQLiteService';
import {SQLiteChannel} from './SQLite.channel';

export function sqliteBind() {
  ipcMain.handle(SQLiteChannel.init, (_e, dbPath: string) => {
    return SQLiteService.init(dbPath);
  });

  ipcMain.handle(SQLiteChannel.exec, (_e, {sql, params}) => {
    return SQLiteService.exec(sql, params);
  });

  ipcMain.handle(SQLiteChannel.select, (_e, {sql, params}) => {
    return SQLiteService.select(sql, params);
  });

  ipcMain.handle(SQLiteChannel.selectSingle, (_e, {sql, params}) => {
    return SQLiteService.selectSingle(sql, params);
  });

  ipcMain.handle(SQLiteChannel.deleteDBFile, (_e) => {
    return SQLiteService.deleteDBFile();
  });
}
