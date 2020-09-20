import {app, BrowserWindow, dialog} from 'electron';
import {StreamIPC} from '../../IPC/StreamIPC';
import fs from "fs";

class _StreamBind {
  async bindIPC(window: BrowserWindow) {
    StreamIPC.initWindow(window);

    StreamIPC.onSetUnreadCount((_ev, unreadCount, badge) => {
      if (!app.dock) return;

      if (unreadCount > 0 && badge) {
        app.dock.setBadge(unreadCount + '');
      } else {
        app.dock.setBadge('');
      }
    });

    StreamIPC.onExportStreams(async (_ev, streams) => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const filePath = dialog.showSaveDialogSync({defaultPath});
      if (!filePath) return;
      fs.writeFileSync(filePath, JSON.stringify(streams, null, 2));
    });

    StreamIPC.onImportStreams(async () => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
      if (!tmp || !tmp.length) return;

      const filePath = tmp[0];
      return JSON.parse(fs.readFileSync(filePath).toString());
    });
  }
}

export const StreamBind = new _StreamBind();
