import {app} from 'electron';
import os from 'os';
import {browserViewIPCBind} from './IPC/BrowserViewIPC/BrowserViewIPC.bind';
import {electronIPCBind} from './IPC/ElectronIPC/ElectronIPC.bind';
import {mainWindowIPCBind} from './IPC/MainWindowIPC/MainWindowIPC.bind';
import {nodeIPCBind} from './IPC/NodeIPC/NodeIPC.bind';
import {SQLiteIPCBind} from './IPC/SQLiteIPC/SQLiteIPC.bind';
import {streamIPCBind} from './IPC/StreamIPC/StreamIPC.bind';
import {userPrefIPCBind} from './IPC/UserPrefIPC/UserPrefIPC.bind';
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

  mainWindowIPCBind(window);
  browserViewIPCBind();
  streamIPCBind();
  SQLiteIPCBind();
  userPrefIPCBind();
  electronIPCBind();
  nodeIPCBind();

  await MainWindow.initRenderer();
}

index();
