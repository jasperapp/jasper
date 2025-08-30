import {contextBridge, ipcRenderer} from 'electron';
import {browserViewIPCExpose} from '../../IPC/BrowserViewIPC/BrowserViewIPC.expose';
import {electronIPCExpose} from '../../IPC/ElectronIPC/ElectronIPC.expose';
import {mainWindowIPCExpose} from '../../IPC/MainWindowIPC/MainWindowIPC.expose';
import {nodeIPCExpose} from '../../IPC/NodeIPC/NodeIPC.expose';
import {SQLiteIPCExpose} from '../../IPC/SQLiteIPC/SQLiteIPC.expose';
import {streamIPCExpose} from '../../IPC/StreamIPC/StreamIPC.expose';
import {userPrefIPCExpose} from '../../IPC/UserPrefIPC/UserPrefIPC.expose';

declare global {
  interface IPC {
    on: (eventName: string, handler: any) => void;
  }
}

contextBridge.exposeInMainWorld('ipc', {
  ...mainWindowIPCExpose.ipc,
  ...browserViewIPCExpose.ipc,
  ...streamIPCExpose.ipc,
  ...SQLiteIPCExpose.ipc,
  ...nodeIPCExpose.ipc,
  ...userPrefIPCExpose.ipc,
  ...electronIPCExpose.ipc,
  on: (eventName, handler) => ipcRenderer.on(eventName, handler),
});
