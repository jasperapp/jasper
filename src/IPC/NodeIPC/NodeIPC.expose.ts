import {ipcRenderer} from 'electron';
import {NodeIPCChannel} from './NodeIPC.channel';

declare global {
  interface IPC {
    node: {
      path: {
        normalize: (path: string) => Promise<string>,
      },
      fs: {
        readFile: (path: string) => Promise<string>,
      }
    },
  }
}

export const nodeIPCExpose = {
  ipc: {
    node: {
      path: {
        normalize: (path: string) => {
          return ipcRenderer.invoke(NodeIPCChannel.normalize, path);
        },
      },
      fs: {
        readFile: (path: string) => {
          return ipcRenderer.invoke(NodeIPCChannel.readFile, path);
        },
      },
    },
  },
}
