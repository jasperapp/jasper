import {ConnectionCheckIPC} from '../IPC/ConnectionCheckIPC';
import {GitHubWindowUtil} from './Util/GitHubWindowUtil';
import {DBIPC} from '../IPC/DBIPC';
import {DB} from './DB';
import {FSUtil} from './Util/FSUtil';
import {ConfigType} from '../Type/ConfigType';
import {AppPath} from './AppPath';
import nodePath from "path";
import path from "path";
import {DangerIPC} from '../IPC/DangerIPC';
import {app, dialog, Menu, MenuItem, powerMonitor, powerSaveBlocker} from 'electron';
import {StreamIPC} from '../IPC/StreamIPC';
import {ConfigIPC} from '../IPC/ConfigIPC';
import {PowerMonitorIPC} from '../IPC/PowerMonitorIPC';
import {KeyboardShortcutIPC} from '../IPC/KeyboardShortcutIPC';

class _IPCSetup {
  setup() {
    this.setupConfigIPC();
    this.setupDBIPC();
    this.setupStreamIPC();
    this.setupConnectionCheckIPC();
    this.setupDangerIPC();
    this.setupPowerMonitorIPC();
    this.setupKeyboardShortcutIPC();
  }

  private setupConfigIPC() {
    const configDir = AppPath.getConfigDir();
    const configPath = AppPath.getConfigPath();

    ConfigIPC.onReadConfig(async () => {
      if (!FSUtil.exist(configPath)) return {};

      const configs = FSUtil.readJSON<ConfigType[]>(configPath);
      return {configs, index: 0};
    });

    ConfigIPC.onWriteConfig(async (_ev, configs) => {
      if (!FSUtil.exist(configPath)) FSUtil.mkdir(configDir);

      FSUtil.writeJSON<ConfigType[]>(configPath, configs);
    });

    ConfigIPC.onDeleteConfig(async (_ev, index) => {
      const configs = FSUtil.readJSON<ConfigType[]>(configPath);
      const config = configs[index];
      const dbPath = nodePath.resolve(nodePath.dirname(configPath), config.database.path);
      FSUtil.rm(dbPath);
      configs.splice(index, 1);
      FSUtil.writeJSON<ConfigType[]>(configPath, configs);
    });
  }

  private setupDBIPC() {
    DBIPC.onExec(async (_ev, {sql, params}) => DB.exec(sql, params));
    DBIPC.onSelect(async (_ev, {sql, params}) => DB.select(sql, params));
    DBIPC.onSelectSingle(async (_ev, {sql, params}) => DB.selectSingle(sql, params));
    DBIPC.onInit(async (_ev, configIndex) => {
      const configs = FSUtil.readJSON<ConfigType[]>(AppPath.getConfigPath());
      const config = configs[configIndex];
      const dbPath = nodePath.resolve(path.dirname(AppPath.getConfigPath()), config.database.path);
      await DB.init(dbPath);
    });
  }

  private setupStreamIPC() {
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
      FSUtil.writeJSON(filePath, streamSettings);
    });

    StreamIPC.onImportStreams(async () => {
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const tmp = dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
      if (!tmp || !tmp.length) return;

      const filePath = tmp[0];
      return {streamSettings: FSUtil.readJSON(filePath)};
    });
  }

  private setupConnectionCheckIPC() {
    ConnectionCheckIPC.onExec(async (_ev, webHost, https) => {
      const p = new Promise(resolve => {
        const githubWindow = GitHubWindowUtil.create(webHost, https);
        githubWindow.on('close', () => resolve());
      });

      await p;
    });
  }

  private setupDangerIPC() {
    DangerIPC.onDeleteAllData(async () => {
      await DB.close();
      if (!FSUtil.rmdir(AppPath.getUserData())) {
        FSUtil.rmdir(AppPath.getConfigDir());
      }
      app.quit();
    });
  }

  private setupPowerMonitorIPC() {
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
