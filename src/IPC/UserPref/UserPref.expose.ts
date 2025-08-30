import {ipcRenderer} from 'electron';
import {UserPrefService} from '../../Main/Service/UserPrefService';
import {UserPrefChannels} from './UserPref.channel';

declare global {
  interface IPC {
    userPref: {
      read: () => Promise<string>;
      write: (pref: string) => Promise<void>;
      deleteRelativeFile: (path: string) => Promise<void>;
      getAbsoluteFilePath: (path: string) => Promise<string>;
      getEachPaths: () => Promise<ReturnType<typeof UserPrefService.getEachPaths>>;
    };
  }
}

export const userPrefExpose = {
  ipc: {
    userPref: {
      read: () => ipcRenderer.invoke(UserPrefChannels.read),
      write: (pref: string) => ipcRenderer.invoke(UserPrefChannels.write, pref),
      deleteRelativeFile: (path: string) => ipcRenderer.invoke(UserPrefChannels.deleteRelativeFile, path),
      getAbsoluteFilePath: (path: string) => ipcRenderer.invoke(UserPrefChannels.absoluteFilePath, path),
      getEachPaths: () => ipcRenderer.invoke(UserPrefChannels.eachPaths),
    },
  }
};
