import {ipcRenderer} from 'electron';
import {NodeChannel} from './Node.channel';

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

export const nodeExpose = {
  ipc: {
    node: {
      path: {
        normalize: (path: string) => ipcRenderer.sendSync(NodeChannel.normalize, path),
        resolve: (...paths: string[]) => ipcRenderer.sendSync(NodeChannel.resolve, paths),
      },
      fs: {
        readFileSync: (path: string) => ipcRenderer.sendSync(NodeChannel.readFileSync, path),
      },
    },
  },
}
