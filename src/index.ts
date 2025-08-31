import {app, nativeImage} from 'electron';
import nodePath from 'node:path';
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
  await app.whenReady();

  // 開発時のアイコンを設定
  if (process.env.JASPER === 'DEV') {
    const iconPath = nodePath.join(__dirname, 'Main/asset/image/jasper-dev.png');
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }

  // メインウィンドウを生成
  await MainWindow.init();
  const window = MainWindow.getWindow();

  // 各種サービスを初期化
  MainWindowService.initWindow(window);
  BrowserViewService.initWindow(window);
  IssueService.initWindow(window);
  StreamService.initWindow(window);

  // bind IPC
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
