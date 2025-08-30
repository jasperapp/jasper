import {ipcMain} from 'electron';
import nodeFs from 'node:fs';
import nodePath from 'node:path';
import {NodeChannel} from './Node.channel';

export function nodeBind() {
  ipcMain.on(NodeChannel.normalize, (e, path: string) => {
    e.returnValue = nodePath.normalize(path);
  });
  ipcMain.on(NodeChannel.resolve, (e, paths: string[]) => {
    e.returnValue = nodePath.resolve(...paths);
  });
  ipcMain.on(NodeChannel.readFileSync, (e, p: string) => {
    e.returnValue = nodeFs.readFileSync(nodePath.join(__dirname, p)).toString();
  });
}
