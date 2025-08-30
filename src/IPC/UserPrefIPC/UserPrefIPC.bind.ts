import {ipcMain} from 'electron';
import {UserPrefService} from '../../Main/Service/UserPrefService';
import {UserPrefChannels} from './UserPrefIPC.channel';

export function userPrefIPCBind() {
  ipcMain.handle(UserPrefChannels.read, (_e) => {
    return UserPrefService.read();
  });

  ipcMain.handle(UserPrefChannels.write, (_e, pref: string) => {
    return UserPrefService.write(pref);
  });

  ipcMain.handle(UserPrefChannels.deleteRelativeFile, (_e, path: string) => {
    return UserPrefService.deleteRelativeFile(path);
  });

  ipcMain.handle(UserPrefChannels.absoluteFilePath, (_e, path) => {
    return UserPrefService.getAbsoluteFilePath(path);
  });

  ipcMain.handle(UserPrefChannels.eachPaths, (_e) => {
    return UserPrefService.getEachPaths();
  });
}
