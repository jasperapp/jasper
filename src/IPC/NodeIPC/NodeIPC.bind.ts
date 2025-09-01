import {ipcMain} from 'electron';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import {NodeIPCChannel} from './NodeIPC.channel';

export function nodeIPCBind() {
  ipcMain.handle(NodeIPCChannel.normalize, (_e, path: string) => {
    return nodePath.normalize(path);
  });

  ipcMain.handle(NodeIPCChannel.readFile, (_e, p: string) => {
    return nodeFs.readFileSync(nodePath.join(__dirname, p)).toString();
  });
}
