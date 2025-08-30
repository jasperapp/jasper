import {ipcRenderer} from 'electron';
import {ElectronIPCChannel} from './ElectronIPC.channel';

declare global {
  interface IPC {
    electron: {
      clipboard: {
        writeText: (text: string) => void,
      },
      shell: {
        showItemInFolder: (path: string) => void,
        openExternal: (url: string) => void,
      }
    },
  }
}

export const electronIPCExpose = {
  ipc: {
    electron: {
      clipboard: {
        writeText: (text: string) => ipcRenderer.sendSync(ElectronIPCChannel.clipboard, text),
      },
      shell: {
        showItemInFolder: (path: string) => ipcRenderer.sendSync(ElectronIPCChannel.showItemInFolder, path),
        openExternal: (url: string) => ipcRenderer.sendSync(ElectronIPCChannel.openExternal, url),
      },
    }
  },
}
