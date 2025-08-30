import {ipcRenderer} from 'electron';
import {ElectronChannel} from './Electron.channel';

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

export const electronExpose = {
  ipc: {
    electron: {
      clipboard: {
        writeText: (text: string) => ipcRenderer.sendSync(ElectronChannel.clipboard, text),
      },
      shell: {
        showItemInFolder: (path: string) => ipcRenderer.sendSync(ElectronChannel.showItemInFolder, path),
        openExternal: (url: string) => ipcRenderer.sendSync(ElectronChannel.openExternal, url),
      },
    }
  },
}
