import {app} from 'electron';
import {AppWindow} from './Main/Window/AppWindow';
import {IPCBind} from './Main/Bind/IPCBind';
import {BrowserViewBind} from './Main/Bind/BrowserViewBind';
import {UserPrefBind} from './Main/Bind/UserPrefBind';
import {SQLiteBind} from './Main/Bind/SQLiteBind';
import {IssueBind} from './Main/Bind/IssueBind';
import {StreamBind} from './Main/Bind/StreamBind';

async function index() {
  await app.whenReady();
  await AppWindow.init();

  // bind IPC
  const window = AppWindow.getWindow();
  await BrowserViewBind.bindIPC(window);
  await UserPrefBind.bindIPC(window);
  await SQLiteBind.bindIPC(window);
  await IssueBind.bindIPC(window);
  await StreamBind.bindIPC(window);
  await IPCBind.bindIPC(window);

  await AppWindow.initRenderer();

  // zoom factorはloadUrlしてからじゃないと取得できないようなので、ここで取得して設定する
  BrowserViewBind.setZoomFactor(window.webContents.getZoomFactor());
}

index();
