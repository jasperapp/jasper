import {UserPrefEntity} from '../Renderer/Library/Type/UserPrefEntity';
import {ipcMain, ipcRenderer} from 'electron';

enum Channels {
  readPrefs = 'UserPrefIPC:readPrefs',
  writePrefs = 'UserPrefIPC:writePrefs',
  deletePref = 'UserPrefIPC:deletePref'
}

class _UserPrefIPC {
  // read prefs
  async readPrefs(): Promise<{prefs: UserPrefEntity[]; index: number}> {
    return ipcRenderer.invoke(Channels.readPrefs);
  }

  onReadPrefs(handler: () => Promise<{prefs?: UserPrefEntity[]; index?: number}>) {
    ipcMain.handle(Channels.readPrefs, handler);
  }

  // write prefs
  async writePrefs(prefs: UserPrefEntity[]): Promise<void> {
    return ipcRenderer.invoke(Channels.writePrefs, prefs);
  }

  onWritePrefs(handler: (_ev, prefs: UserPrefEntity[]) => Promise<void>) {
    ipcMain.handle(Channels.writePrefs, handler);
  }

  // delete pref
  async deletePref(index: number): Promise<void> {
    return ipcRenderer.invoke(Channels.deletePref, index);
  }

  onDeletePref(handler: (_ev, index: number) => Promise<void>) {
    ipcMain.handle(Channels.deletePref, handler);
  }
}

export const UserPrefIPC = new _UserPrefIPC();
