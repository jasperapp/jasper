import {contextBridge, ipcRenderer} from 'electron';
import {browserViewIPCExpose} from '../../IPC/BrowserViewIPC/BrowserViewIPC.expose';
import {electronExpose} from '../../IPC/Electron/Electron.expose';
import {mainWindowExpose} from '../../IPC/MainWindowIPC/MainWindowIPC.expose';
import {nodeExpose} from '../../IPC/Node/Node.expose';
import {sqliteExpose} from '../../IPC/SQLite/SQLite.expose';
import {streamIPCExpose} from '../../IPC/Stream/StreamIPC.expose';
import {userPrefExpose} from '../../IPC/UserPref/UserPref.expose';

declare global {
  interface IPC {
    on: (eventName: string, handler: any) => void;
  }
}

contextBridge.exposeInMainWorld('ipc', {
  ...mainWindowExpose.ipc,
  ...browserViewIPCExpose.ipc,
  ...streamIPCExpose.ipc,
  ...sqliteExpose.ipc,
  ...nodeExpose.ipc,
  ...userPrefExpose.ipc,
  ...electronExpose.ipc,
  on: (eventName, handler) => ipcRenderer.on(eventName, handler),
});
