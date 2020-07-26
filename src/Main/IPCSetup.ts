import {MiscWindow} from './Window/MiscWindow';
import {DBIPC} from '../IPC/DBIPC';
import {DB} from './Storage/DB';
import {FS} from './Storage/FS';
import {app, BrowserWindow, dialog, powerMonitor} from 'electron';
import {StreamIPC} from '../IPC/StreamIPC';
import {ConfigIPC} from '../IPC/ConfigIPC';
import {ConfigStorage} from './Storage/ConfigStorage';
import {AppIPC} from '../IPC/AppIPC';
import {AppMenu} from './Window/AppMenu';
import {GAIPC} from '../IPC/GAIPC';

class _IPCSetup {
  setup(window: BrowserWindow) {
    this.setupAppIPC(window);
    this.setupConfigIPC();
    this.setupDBIPC();
    this.setupStreamIPC(window);
    this.setupGAIPC(window);
  }

  private setupAppIPC(window: BrowserWindow) {
    AppIPC.initWindow(window);

    AppIPC.onOpenNewWindow(async (_ev, webHost, https) => {
      const p = new Promise(resolve => {
        const window = MiscWindow.create(webHost, https);
        window.on('close', () => resolve());
      });
      await p;
    });

    AppIPC.onDeleteAllData(async () => {
      await DB.close();
      ConfigStorage.deleteUserData();
      app.quit();
    });

    AppIPC.onKeyboardShortcut((_ev, enable) => AppMenu.enableShortcut(enable));

    powerMonitor.on('suspend', () => AppIPC.powerMonitorSuspend());
    powerMonitor.on('resume', () => AppIPC.powerMonitorResume());
  }

  private setupConfigIPC() {
    ConfigIPC.onReadConfig(async () => ConfigStorage.readConfigs());
    ConfigIPC.onWriteConfigs(async (_ev, configs) => ConfigStorage.writeConfigs(configs));
    ConfigIPC.onDeleteConfig(async (_ev, index) => ConfigStorage.deleteConfig(index));
  }

  private setupDBIPC() {
    DBIPC.onExec(async (_ev, {sql, params}) => DB.exec(sql, params));
    DBIPC.onSelect(async (_ev, {sql, params}) => DB.select(sql, params));
    DBIPC.onSelectSingle(async (_ev, {sql, params}) => DB.selectSingle(sql, params));
    DBIPC.onInit(async (_ev, configIndex) => {
      const dbPath = ConfigStorage.getDBPath(configIndex);
      await DB.init(dbPath);
    });
  }

  private setupStreamIPC(window: BrowserWindow) {
    StreamIPC.initWindow(window);
    StreamIPC.onSetUnreadCount((_ev, unreadCount, badge) => {
      if (!app.dock) return;

      if (unreadCount > 0 && badge) {
        app.dock.setBadge(unreadCount + '');
      } else {
        app.dock.setBadge('');
      }
    });

    StreamIPC.onExportStreams(async (_ev, streamSettings) => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const filePath = dialog.showSaveDialogSync({defaultPath});
      if (!filePath) return;
      FS.writeJSON(filePath, streamSettings);
    });

    StreamIPC.onImportStreams(async () => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
      if (!tmp || !tmp.length) return;

      const filePath = tmp[0];
      return {streamSettings: FS.readJSON(filePath)};
    });
  }

  private setupGAIPC(window: BrowserWindow) {
    GAIPC.initWindow(window);
  }
}

export const IPCSetup = new _IPCSetup();
