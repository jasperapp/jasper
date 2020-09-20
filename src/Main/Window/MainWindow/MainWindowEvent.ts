import {app} from "electron";
import {MainWindow} from './MainWindow';
import {StreamIPC} from '../../../IPC/StreamIPC';

class _MainWindowEvent {
  async init() {
    this.initAllClosedEvent();
    this.initUnhandledRejectionEvent();
    this.initURLSchemeEvent();
    this.initWindowFocusEvent();
  }

  private initAllClosedEvent() {
    app.on('window-all-closed', ()=> app.quit());
  }

  private initUnhandledRejectionEvent() {
    process.on('unhandledRejection', (reason, p) => {
      console.error(`Unhandled Rejection at: ${p}`);
      console.error(`reason: ${reason}`);
      console.error(reason)
    });
  }

  // handle that open with custom URL schema.
  // jasperapp://stream?name=...&queries=...&color=...&notification=...
  private initURLSchemeEvent() {
    app.on('will-finish-launching', () => {
      app.on('open-url', async (e, url) => {
        e.preventDefault();
        const urlObj = require('url').parse(url, true);

        if (urlObj.host === 'stream') {
          const stream = {
            name: urlObj.query.name || '',
            queries: urlObj.query.queries || '[]',
            notification: parseInt(urlObj.query.notification, 10),
            color: urlObj.query.color || ''
          };

          MainWindow.getWindow().webContents.send('create-new-stream', stream);
        }
      });
    });
  }

  private initWindowFocusEvent() {
    let lastFocusedRestartTime = Date.now();

    MainWindow.getWindow().on('focus', () => {
      // 最終restartから30分以上たっていたら、restartする
      const nowTime = Date.now();
      if (nowTime - lastFocusedRestartTime >= 1800000) {
        lastFocusedRestartTime = nowTime;
        console.log('[restart streams only polling by focused]');
        StreamIPC.restartAllStreams();
      }
    });
  }
}

export const MainWindowEvent = new _MainWindowEvent();
