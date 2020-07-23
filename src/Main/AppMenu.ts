import electron, {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  OpenDialogSyncOptions,
  shell
} from 'electron';
import {BrowserViewProxy} from './BrowserViewProxy';
import {AppWindow} from './AppWindow';
import {Config} from './Config';
import {AppPath} from './AppPath';
import {FSUtil} from './Util/FSUtil';
import {Bootstrap} from './Bootstrap';

class _AppMenu {
  private mainMenu: Menu;
  private minimumMenu: Menu;
  private skipReadIssue: number = 0;
  private currentZoom: number = 1;

  applyMainMenu() {
    if (!this.mainMenu) this.buildMainMenu();
    Menu.setApplicationMenu(this.mainMenu);
  }

  applyMinimumMenu() {
    if (!this.minimumMenu) this.buildMinimumMenu();
    Menu.setApplicationMenu(this.minimumMenu);
  }

  private showAbout() {
    const width = 275;
    const height = 265;
    const {x, y} = this.getCenterOnMainWindow(width, height);
    const aboutWindow = new BrowserWindow({
      title: '',
      width,
      height,
      x,
      y,
      backgroundColor: "#e7e7e7",
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      resizable: false,
      show: false,
      parent: AppWindow.getWindow(),
      webPreferences: {
        nodeIntegration: true
      }
    });

    aboutWindow.loadURL(`file://${__dirname}/../Electron/html/about.html#${app.getVersion()}`);
    aboutWindow.once('ready-to-show', ()=> aboutWindow.show());
    aboutWindow.on('closed', ()=> this.applyMainMenu());
    this.applyMinimumMenu();
    aboutWindow.setMenu(null);
  }

  private showPreferences() {
    const mainWindow = AppWindow.getWindow();
    const width = 500;
    const height = 350;
    const {x, y} = this.getCenterOnMainWindow(width, height);
    const config = Config.activeConfig;
    const prefWindow = new electron.BrowserWindow({
      title: 'Preferences',
      width: 500,
      height: 350,
      x,
      y,
      backgroundColor: "#e7e7e7",
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      resizable: false,
      show: false,
      parent: mainWindow,
      webPreferences: {
        nodeIntegration: true
      }
    });
    prefWindow.loadURL(`file://${__dirname}/../Electron/html/preferences/preferences.html`);

    ipcMain.once('fonts-ready', ()=> prefWindow.show());
    prefWindow.webContents.on('dom-ready', ()=> prefWindow.webContents.send('current-config', config));
    prefWindow.on('closed', ()=> this.applyMainMenu());

    ipcMain.on('apply-config', (_ev, newConfig) =>{
      ipcMain.removeAllListeners('apply-config');

      let isChanged = false;
      if (config.general.browser !== newConfig.general.browser) isChanged = true;
      if (config.general.notification !== newConfig.general.notification) isChanged = true;
      if (config.general.notificationSilent !== newConfig.general.notificationSilent) isChanged = true;
      if (config.general.onlyUnreadIssue !== newConfig.general.onlyUnreadIssue) isChanged = true;
      if (config.general.badge !== newConfig.general.badge) isChanged = true;
      if (config.general.alwaysOpenExternalUrlInExternalBrowser !== newConfig.general.alwaysOpenExternalUrlInExternalBrowser) isChanged = true;
      if (config.database.max !== newConfig.database.max) isChanged = true;

      if (isChanged) apply();

      this.applyMainMenu();

      async function apply() {
        config.general = newConfig.general;
        config.database.max = newConfig.database.max;
        Config.updateConfig(Config.activeIndex, config);
      }
    });

    ipcMain.on('delete-all-data', async ()=>{
      ipcMain.removeAllListeners('apply-config');

      const Bootstrap = require('./Bootstrap.js').Bootstrap;
      Bootstrap.stop();

      const DB = require('./DB/DB').DB;
      await DB.close();

      if (!FSUtil.rmdir(AppPath.getUserData())) {
        FSUtil.rmdir(AppPath.getConfigDir());
      }

      app.quit();
    });

    // save streams
    {
      ipcMain.removeAllListeners('save-streams');
      ipcMain.on('save-streams', async () =>{
        const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
        const filePath = electron.dialog.showSaveDialogSync({defaultPath});
        if (!filePath) return;

        const output = await require('./Stream/SaveAndLoadStreams').SaveAndLoadStreams.save();
        FSUtil.writeJSON(filePath, output);
      });
    }

    // load streams
    {
      ipcMain.removeAllListeners('load-streams');
      ipcMain.on('load-streams', async () =>{
        const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
        const tmp = electron.dialog.showOpenDialogSync({defaultPath, properties: ['openFile']});
        if (!tmp || !tmp.length) return;

        const filePath = tmp[0];
        const data = FSUtil.readJSON(filePath);
        await require('./Stream/SaveAndLoadStreams').SaveAndLoadStreams.load(data);
      });
    }

    // theme
    {
      ipcMain.removeAllListeners('load-theme-main');
      ipcMain.removeAllListeners('load-theme-browser');
      ipcMain.removeAllListeners('load-theme-default');

      ipcMain.on('load-theme-main', ()=>{
        // open dialog
        const option: OpenDialogSyncOptions = {
          defaultPath: app.getPath('home'),
          properties: ['openFile'],
          filters: [{name: 'CSS', extensions: ['css']}]
        };
        const tmp = electron.dialog.showOpenDialogSync(option);
        if (!tmp || !tmp.length) return;

        const filePath = tmp[0];

        // emit loading theme
        const css = FSUtil.read(filePath);
        mainWindow.webContents.send('load-theme-main', css);

        // remove file
        if (Config.themeMainPath) FSUtil.rm(Config.themeMainPath);

        // copy file
        const fileName = `theme-main-${Date.now()}.css`;
        FSUtil.copy(filePath, `${AppPath.getConfigDir()}/${fileName}`);
        config.theme.main = `./${fileName}`;
        Config.updateConfig(Config.activeIndex, config);
      });

      ipcMain.on('load-theme-browser', ()=>{
        // open dialog
        const option: OpenDialogSyncOptions = {
          defaultPath: app.getPath('home'),
          properties: ['openFile'],
          filters: [{name: 'CSS', extensions: ['css']}]
        };
        const tmp = electron.dialog.showOpenDialogSync(option);
        if (!tmp || !tmp.length) return;

        const filePath = tmp[0];

        // emit loading theme
        const css = FSUtil.read(filePath);
        mainWindow.webContents.send('load-theme-browser', css);

        // remove file
        if (Config.themeBrowserPath) FSUtil.rm(Config.themeBrowserPath);

        // copy file
        const fileName = `theme-browser-${Date.now()}.css`;
        FSUtil.copy(filePath, `${AppPath.getConfigDir()}/${fileName}`);
        config.theme.browser = `./${fileName}`;
        Config.updateConfig(Config.activeIndex, config);
      });

      ipcMain.on('load-theme-default', ()=>{
        if (Config.themeMainPath) FSUtil.rm(Config.themeMainPath);
        if (Config.themeBrowserPath) FSUtil.rm(Config.themeBrowserPath);

        config.theme.main = null;
        config.theme.browser = null;
        Config.updateConfig(Config.activeIndex, config);

        mainWindow.webContents.send('load-theme-main', '');
        mainWindow.webContents.send('load-theme-browser', '');
      });
    }

    this.applyMinimumMenu();
    prefWindow.setMenu(null);
  }

  private getCenterOnMainWindow(width: number, height: number): {x: number, y: number} {
    const mainWindow = AppWindow.getWindow();
    const mainWindowSize = mainWindow.getSize();
    const mainWindowPos = mainWindow.getPosition();
    const x = Math.floor(mainWindowPos[0] + (mainWindowSize[0] / 2 - width / 2));
    const y = Math.floor(mainWindowPos[1] + (mainWindowSize[1] / 2 - height / 2));
    return {x, y};
  }

  private async quit() {
    await require('../Util/GA').GA.eventAppEnd('app', 'end');
    app.exit(0);
  }

  private switchLayout(layout: 'single' | 'two' | 'three') {
    AppWindow.getWindow().webContents.send('switch-layout', layout);
    require('../Util/GA').GA.eventMenu(`layout:${layout}`);
  }

  // target is webview|issues|streams
  private commandWebContents(target: 'app' | 'webview' | 'issues' | 'streams', command: string) {
    // hack
    if (this.skipReadIssue && target === 'issues' && ['next', 'prev'].includes(command)) command = `${command}_with_skip`;

    AppWindow.getWindow().webContents.send(`command-${target}`, {command});

    require('../Util/GA').GA.eventMenu(`${target}:${command}`);
  }

  private zoom(diffFactor: number, abs: boolean) {
    if (abs) {
      this.currentZoom = diffFactor;
    } else {
      this.currentZoom += diffFactor;
    }

    this.currentZoom = Math.max(this.currentZoom, 0.05);

    AppWindow.getWindow().webContents.setZoomFactor(this.currentZoom);
    BrowserViewProxy.setZoomFactor(this.currentZoom);

    require('../Util/GA').GA.eventMenu(`zoom:${this.currentZoom}`);
  }

  private openConfigDir() {
    shell.showItemInFolder(AppPath.getConfigPath());
  }

  async vacuum() {
    const notification = new electron.Notification({title: 'SQLite Vacuum', body: 'Running...'});
    notification.show();

    const Bootstrap = require('./Bootstrap.js').Bootstrap;
    await Bootstrap.stop();
    await require('./DB/DB').DB.exec('vacuum');
    await Bootstrap.restart();

    notification.close();
  }

  private restartAllStreams() {
    Bootstrap.restart();
  }

  private buildMainMenu() {
    const template: MenuItemConstructorOptions[] = [
      {
        label: "Application",
        submenu: [
          { label: "About Jasper", click: this.showAbout.bind(this) },
          { type: "separator" },
          { label: "Preferences", accelerator: "CmdOrCtrl+,", click: this.showPreferences.bind(this) },
          { label: "Update", click: ()=>{electron.shell.openExternal('https://jasperapp.io/release.html')} },
          { type: "separator" },
          { label: 'Services', role: 'services' },
          { type: "separator" },
          { label: 'Hide Jasper', accelerator: 'CmdOrCtrl+H', role: 'hide' },
          { label: 'Hide Others', accelerator: 'Option+CmdOrCtrl+H', role: 'hideOthers' },
          { label: 'Show All', role: 'unhide' },
          { type: "separator" },
          { label: "Quit Jasper", accelerator: "CmdOrCtrl+Q", click: this.quit.bind(this)}
        ]
      },
      {
        label: "Edit",
        submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
        ]
      },
      {
        label: 'View',
        submenu: [
          { label: 'Single Pane', accelerator: 'CmdOrCtrl+1', click: this.switchLayout.bind(this, 'single') },
          { label: 'Two Pane', accelerator: 'CmdOrCtrl+2', click: this.switchLayout.bind(this, 'two') },
          { label: 'Three Pane', accelerator: 'CmdOrCtrl+3', click: this.switchLayout.bind(this, 'three') },
          { type: "separator" },
          { label: 'Full Screen', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Streams',
        submenu: [
          { label: 'Next Stream', accelerator: 'D', click: this.commandWebContents.bind(this, 'app', 'next_stream')},
          { label: 'Prev Stream', accelerator: 'F', click: this.commandWebContents.bind(this, 'app', 'prev_stream')},
          { type: 'separator' },
          { label: 'LIBRARY', submenu: [
              { label: 'Inbox', accelerator: 'F1', click: this.commandWebContents.bind(this, 'app', 'load_inbox')},
              { label: 'Unread', accelerator: 'F2', click: this.commandWebContents.bind(this, 'app', 'load_unread')},
              { label: 'Open', accelerator: 'F3', click: this.commandWebContents.bind(this, 'app', 'load_open')},
              { label: 'Star', accelerator: 'F4', click: this.commandWebContents.bind(this, 'app', 'load_mark')},
              { label: 'Archive', accelerator: 'F5', click: this.commandWebContents.bind(this, 'app', 'load_archive')}
            ]},
          { label: 'SYSTEM', submenu: [
              { label: 'Me', accelerator: 'F6', click: this.commandWebContents.bind(this, 'app', 'load_me')},
              { label: 'Team', accelerator: 'F7', click: this.commandWebContents.bind(this, 'app', 'load_team')},
              { label: 'Watching', accelerator: 'F8', click: this.commandWebContents.bind(this, 'app', 'load_watching')},
              { label: 'Subscription', accelerator: 'F9', click: this.commandWebContents.bind(this, 'app', 'load_subscription')}
            ]},
          { label: 'STREAMS', submenu: [
              { label: '1st', accelerator: '1', click: this.commandWebContents.bind(this, 'app', 'load_1st')},
              { label: '2nd', accelerator: '2', click: this.commandWebContents.bind(this, 'app', 'load_2nd')},
              { label: '3rd', accelerator: '3', click: this.commandWebContents.bind(this, 'app', 'load_3rd')},
              { label: '4th', accelerator: '4', click: this.commandWebContents.bind(this, 'app', 'load_4th')},
              { label: '5th', accelerator: '5', click: this.commandWebContents.bind(this, 'app', 'load_5th')}
            ]},
          { type: 'separator' },
          { label: 'Restart Streams', accelerator: 'Alt+L', click: this.restartAllStreams.bind(this) }
        ]
      },
      {
        label: 'Issues',
        submenu: [
          { label: 'Load Issues', accelerator: '.', click: this.commandWebContents.bind(this, 'issues', 'load') },
          { type: 'separator' },
          { label: 'Next Issue', accelerator: 'J', click: this.commandWebContents.bind(this, 'issues', 'next') },
          { label: 'Prev Issue', accelerator: 'K', click: this.commandWebContents.bind(this, 'issues', 'prev') },
          { label: 'Skip Read(On/Off)', accelerator: 'Y', type: 'checkbox', click: ()=>{ this.skipReadIssue ^= 1 } },
          { type: 'separator' },
          { label: 'Toggle', submenu: [
              { label: 'Read', accelerator: 'I', click: this.commandWebContents.bind(this, 'webview', 'read') },
              { label: 'Star', accelerator: 'S', click: this.commandWebContents.bind(this, 'webview', 'mark') },
              { label: 'Archive', accelerator: 'E', click: this.commandWebContents.bind(this, 'webview', 'archive') }
            ]},
          { type: 'separator' },
          {label: 'Filter', submenu: [
              { label: 'Focus On', accelerator: '/', click: this.commandWebContents.bind(this, 'issues', 'focus_filter') },
              { label: 'Author', accelerator: 'A', click: this.commandWebContents.bind(this, 'issues', 'filter_author') },
              { label: 'Assignee', accelerator: 'N', click: this.commandWebContents.bind(this, 'issues', 'filter_assignee') },
              { label: 'Unread', accelerator: 'U', click: this.commandWebContents.bind(this, 'issues', 'filter_unread') },
              { label: 'Open', accelerator: 'O', click: this.commandWebContents.bind(this, 'issues', 'filter_open') },
              { label: 'Star', accelerator: 'M', click: this.commandWebContents.bind(this, 'issues', 'filter_mark') },
              { label: 'Clear', accelerator: 'C', click: this.commandWebContents.bind(this, 'issues', 'filter_clear') }
            ]},
          { type: 'separator' },
          { label: 'Open with External', accelerator: 'CmdOrCtrl+O', click: this.commandWebContents.bind(this, 'webview', 'export') }
        ]
      },
      {
        label: 'Page',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: this.commandWebContents.bind(this, 'webview', 'reload') },
          { label: 'Back', accelerator: 'CmdOrCtrl+[', click: this.commandWebContents.bind(this, 'webview', 'back') },
          { label: 'Forward', accelerator: 'CmdOrCtrl+]', click: this.commandWebContents.bind(this, 'webview', 'forward') },
          { type: 'separator' },
          { label: 'Scroll Down', accelerator: 'CmdOrCtrl+J', click: this.commandWebContents.bind(this, 'webview', 'scroll_down') },
          { label: 'Scroll Up', accelerator: 'CmdOrCtrl+K', click: this.commandWebContents.bind(this, 'webview', 'scroll_up') },
          { type: 'separator' },
          { label: 'Open Location', accelerator: 'CmdOrCtrl+L', click: this.commandWebContents.bind(this, 'webview', 'open_location') }
        ]
      },
      {
        label: 'Window', role: 'window',
        submenu: [
          {label: 'Zoom +', accelerator: 'CmdOrCtrl+Plus', click: this.zoom.bind(this, 0.05, false)},
          {label: 'Zoom -', accelerator: 'CmdOrCtrl+-', click: this.zoom.bind(this, -0.05, false)},
          {label: 'Zoom Reset', accelerator: 'CmdOrCtrl+0', click: this.zoom.bind(this, 1, true)},
          { type: "separator" },
          {label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize'},
          {label: 'Bring All to Front', role: 'front'}
        ]
      },
      {
        label: 'Help', role: 'help',
        submenu: [
          {label: 'Documentation', submenu: [
              {label: 'Library', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#library')}},
              {label: 'System', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#your-issues')}},
              {label: 'Stream', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#stream')}},
              {label: 'Filter', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#filter')}},
              {label: 'Sort', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#sort')}},
              {label: 'Issue', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#issue')}},
              {label: 'Shortcut Key', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html#shortcut')}}
            ]},
          {label: 'FAQ', click: ()=>{electron.shell.openExternal('https://jasperapp.io/faq.html')}},
          {label: 'Feedback', click: ()=>{electron.shell.openExternal('https://github.com/jasperapp/jasper')}}
        ]
      },
      {
        label: 'Dev',
        submenu: [
          {label: 'DevTools(Main)', click: ()=>{ AppWindow.getWindow().webContents.openDevTools({mode: 'detach'}); }},
          {label: 'DevTools(BrowserView)', click: ()=>{ BrowserViewProxy.openDevTools({mode: 'detach'}); }},
          { type: 'separator' },
          {label: 'Open Config Directory', click: this.openConfigDir.bind(this)},
          {label: 'SQLite Vacuum', click: this.vacuum.bind(this)},
        ]
      }
    ];

    this.mainMenu = Menu.buildFromTemplate(template);
  }

  private buildMinimumMenu() {
    const minimumTemplate: MenuItemConstructorOptions[] = [
      {
        label: "Application",
        submenu: [
          { label: "About Jasper", click: this.showAbout.bind(this) },
          { type: "separator" },
          { label: 'Services', role: 'services' },
          { type: "separator" },
          { label: 'Hide Jasper', accelerator: 'Command+H', role: 'hide' },
          { label: 'Hide Others', accelerator: 'Option+Command+H', role: 'hideOthers' },
          { label: 'Show All', role: 'unhide' },
          { type: "separator" },
          { label: "Quit Jasper", accelerator: "Command+Q", click: ()=> { electron.app.quit(); }}
        ]
      },
      {
        label: "Edit",
        submenu: [
          { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
          { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", role: "redo" },
          { type: "separator" },
          { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
        ]
      },
      {
        label: 'Window', role: 'window',
        submenu: [
          {label: 'Minimize', accelerator: 'Command+M', role: 'minimize'},
          {label: 'Bring All to Front', role: 'front'}
        ]
      },
      {
        label: 'Help', role: 'help',
        submenu: [
          {label: 'Documentation', click: ()=>{electron.shell.openExternal('https://jasperapp.io/doc.html')}},
          {label: 'FAQ', click: ()=>{electron.shell.openExternal('https://jasperapp.io/faq.html')}},
          {label: 'Feedback', click: ()=>{electron.shell.openExternal('https://github.com/jasperapp/jasper')}}
        ]
      },
      {
        label: 'Dev',
        submenu: [
          {label: 'DevTools', click: ()=>{ AppWindow.getWindow().webContents.openDevTools(); }},
          { type: 'separator' },
          {label: 'Open Config Directory', click: this.openConfigDir.bind(this)},
        ]
      }
    ];

    this.minimumMenu = Menu.buildFromTemplate(minimumTemplate);
  }
}

export const AppMenu = new _AppMenu();
