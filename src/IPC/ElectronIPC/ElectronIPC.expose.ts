import {ipcRenderer} from 'electron';
import {ElectronIPCChannel} from './ElectronIPC.channel';

declare global {
  interface IPC {
    electron: {
      clipboard: {
        writeText: (text: string) => Promise<void>,
      },
      shell: {
        showItemInFolder: (path: string) => Promise<void>,
        openExternal: (url: string) => Promise<void>,
      }
    },
  }
}

export const electronIPCExpose = {
  ipc: {
    electron: {
      clipboard: {
        writeText: (text: string) => {
          return ipcRenderer.invoke(ElectronIPCChannel.clipboard, text);
        },
      },
      shell: {
        showItemInFolder: (path: string) => {
          return ipcRenderer.invoke(ElectronIPCChannel.showItemInFolder, path);
        },
        openExternal: (url: string) => {
          return ipcRenderer.invoke(ElectronIPCChannel.openExternal, url);
        },
      },
    }
  },
}
