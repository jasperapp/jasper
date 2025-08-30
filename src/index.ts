import {app} from 'electron';
import os from 'os';
import {browserViewIPCBind} from './IPC/BrowserViewIPC/BrowserViewIPC.bind';
import {electronBind} from './IPC/Electron/Electron.bind';
import {mainWindowBind} from './IPC/MainWindowIPC/MainWindowIPC.bind';
import {nodeBind} from './IPC/Node/Node.bind';
import {sqliteBind} from './IPC/SQLite/SQLite.bind';
import {streamBind} from './IPC/Stream/StreamIPC.bind';
import {userPrefBind} from './IPC/UserPref/UserPref.bind';
import {BrowserViewService} from './Main/Service/BrowserViewService';
import {IssueService} from './Main/Service/IssueService';
import {MainWindowService} from './Main/Service/MainWindowService';
import {StreamService} from './Main/Service/StreamService';
import {MainWindow} from './Main/Window/MainWindow/MainWindow';

async function index() {
  if (os.platform() === 'win32') {
    if (require('electron-squirrel-startup')) return;
  }

  await app.whenReady();
  await MainWindow.init();

  // bind IPC
  const window = MainWindow.getWindow();
  // await MainWindowBind.bindIPC(window);
  // await BrowserViewBind.bindIPC(window);
  // await UserPrefBind.bindIPC(window);
  // await SQLiteBind.bindIPC(window);
  // await IssueBind.bindIPC(window);
  // await StreamBind.bindIPC(window);

  MainWindowService.initWindow(window);
  BrowserViewService.initWindow(window);
  IssueService.initWindow(window);
  StreamService.initWindow(window);

  mainWindowBind(window);
  browserViewIPCBind();
  streamBind();
  sqliteBind();
  userPrefBind();
  electronBind();
  nodeBind();

  await MainWindow.initRenderer();
}

index();
