import {app} from 'electron';
import {AppWindow} from './Main/Window/AppWindow';
import {IPCBind} from './Main/Bind/IPCBind';
import {BrowserViewBind} from './Main/Bind/BrowserViewBind';
import {UserPrefBind} from './Main/Bind/UserPrefBind';

async function index() {
  await app.whenReady();
  await AppWindow.init();
  await BrowserViewBind.bindIPC(AppWindow.getWindow());
  await UserPrefBind.bindIPC(AppWindow.getWindow());
  await IPCBind.init(AppWindow.getWindow());
  await AppWindow.initRenderer();

  // zoom factorはloadUrlしてからじゃないと取得できないようなので、ここで取得して設定する
  BrowserViewBind.setZoomFactor(AppWindow.getWindow().webContents.getZoomFactor());
}

index();
