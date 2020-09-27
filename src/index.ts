import os from 'os';
import {app} from 'electron';
import {MainWindow} from './Main/Window/MainWindow/MainWindow';
import {MainWindowBind} from './Main/Bind/MainWindowBind';
import {BrowserViewBind} from './Main/Bind/BrowserViewBind';
import {UserPrefBind} from './Main/Bind/UserPrefBind';
import {SQLiteBind} from './Main/Bind/SQLiteBind';
import {IssueBind} from './Main/Bind/IssueBind';
import {StreamBind} from './Main/Bind/StreamBind';

async function index() {
  if (os.platform() === 'win32') {
    if (require('electron-squirrel-startup')) return;
  }

  await app.whenReady();
  await MainWindow.init();

  // bind IPC
  const window = MainWindow.getWindow();
  await MainWindowBind.bindIPC(window);
  await BrowserViewBind.bindIPC(window);
  await UserPrefBind.bindIPC(window);
  await SQLiteBind.bindIPC(window);
  await IssueBind.bindIPC(window);
  await StreamBind.bindIPC(window);

  await MainWindow.initRenderer();
}

index();
