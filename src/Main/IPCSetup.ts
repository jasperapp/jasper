import {ConnectionCheckIPC} from '../IPC/ConnectionCheckIPC';
import {MiscWindow} from './Window/MiscWindow';
import {DBIPC} from '../IPC/DBIPC';
import {DB} from './Storage/DB';
import {FS} from './Storage/FS';
import {DangerIPC} from '../IPC/DangerIPC';
import {app, BrowserWindow, dialog, Menu, MenuItem, powerMonitor, powerSaveBlocker} from 'electron';
import {StreamIPC} from '../IPC/StreamIPC';
import {ConfigIPC} from '../IPC/ConfigIPC';
import {PowerMonitorIPC} from '../IPC/PowerMonitorIPC';
import {KeyboardShortcutIPC} from '../IPC/KeyboardShortcutIPC';
import {ConfigStorage} from './Storage/ConfigStorage';

class _IPCSetup {
  setup(window: BrowserWindow) {
    this.setupConfigIPC();
    this.setupDBIPC();
    this.setupStreamIPC(window);
    this.setupConnectionCheckIPC();
    this.setupDangerIPC();
    this.setupPowerMonitorIPC(window);
    this.setupKeyboardShortcutIPC();
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

  private setupConnectionCheckIPC() {
    ConnectionCheckIPC.onExec(async (_ev, webHost, https) => {
      const p = new Promise(resolve => {
        const window = MiscWindow.create(webHost, https);
        window.on('close', () => resolve());
      });

      await p;
    });
  }

  private setupDangerIPC() {
    DangerIPC.onDeleteAllData(async () => {
      await DB.close();
      ConfigStorage.deleteUserData();
      app.quit();
    });
  }

  private setupPowerMonitorIPC(window: BrowserWindow) {
    PowerMonitorIPC.initWindow(window);
    powerSaveBlocker.start('prevent-app-suspension');
    powerMonitor.on('suspend', () => PowerMonitorIPC.suspend());
    powerMonitor.on('resume', () => PowerMonitorIPC.resume());
  }

  private setupKeyboardShortcutIPC() {
    function enableShortcut(menu: MenuItem, enable: boolean) {
      if(!['Streams', 'Issues', 'Page'].includes(menu.label)) throw new Error(`this is unknown menu: ${menu.label}`);

      for (const item of menu.submenu.items) {
        if(item.accelerator && item.accelerator.length === 1) item.enabled = enable;

        if (item.submenu) {
          for (const _item of item.submenu.items) {
            if(_item.accelerator && _item.accelerator.length === 1) _item.enabled = enable;
          }
        }
      }
    }

    KeyboardShortcutIPC.onEnable((_ev, enable) => {
      const appMenu = Menu.getApplicationMenu();
      enableShortcut(appMenu.items[3], enable); // streams
      enableShortcut(appMenu.items[4], enable); // issues
      enableShortcut(appMenu.items[5], enable); // page
    });
  }
}

export const IPCSetup = new _IPCSetup();
