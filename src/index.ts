import {app} from 'electron';
import {AppWindow} from './Main/Window/AppWindow';
import {IPCBind} from './Main/Bind/IPCBind';
import {BrowserViewBind} from './Main/Bind/BrowserViewBind';

async function index() {
  await app.whenReady();
  await AppWindow.init();
  await BrowserViewBind.init(AppWindow.getWindow());
  await IPCBind.init(AppWindow.getWindow());
}

index();
