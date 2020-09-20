import {app} from 'electron';
import {AppWindow} from './Main/Window/AppWindow';
import {MainWindowBind} from './Main/Bind/MainWindowBind';
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
  await MainWindowBind.bindIPC(window);
  await BrowserViewBind.bindIPC(window);
  await UserPrefBind.bindIPC(window);
  await SQLiteBind.bindIPC(window);
  await IssueBind.bindIPC(window);
  await StreamBind.bindIPC(window);

  await AppWindow.initRenderer();
}

index();
