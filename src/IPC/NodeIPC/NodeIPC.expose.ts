import {ipcRenderer} from 'electron';
import {NodeIPCChannel} from './NodeIPC.channel';

declare global {
  interface IPC {
    node: {
      path: {
        normalize: (path: string) => string,
        resolve: (...paths: string[]) => string,
      },
      fs: {
        readFileSync: (path: string) => string,
      }
    },
  }
}

export const nodeIPCExpose = {
  ipc: {
    node: {
      path: {
        normalize: (path: string) => ipcRenderer.sendSync(NodeIPCChannel.normalize, path),
        resolve: (...paths: string[]) => ipcRenderer.sendSync(NodeIPCChannel.resolve, paths),
      },
      fs: {
        readFileSync: (path: string) => ipcRenderer.sendSync(NodeIPCChannel.readFileSync, path),
      },
    },
  },
}
