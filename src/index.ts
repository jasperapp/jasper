import {app} from 'electron';
import {AppWindow} from './Main/Window/AppWindow';
import {IPCBind} from './Main/Bind/IPCBind';
import {BrowserViewBind} from './Main/Bind/BrowserViewBind';
import {UserPrefBind} from './Main/Bind/UserPrefBind';
import {SQLiteBind} from './Main/Bind/SQLiteBind';

async function index() {
  await app.whenReady();
  await AppWindow.init();

  const window = AppWindow.getWindow();
  await BrowserViewBind.bindIPC(window);
  await UserPrefBind.bindIPC(window);
  await SQLiteBind.bindIPC(window);
  await IPCBind.init(AppWindow.getWindow());

  await AppWindow.initRenderer();

  // zoom factorはloadUrlしてからじゃないと取得できないようなので、ここで取得して設定する
  BrowserViewBind.setZoomFactor(window.webContents.getZoomFactor());
}

index();
