import Logger from 'color-logger';
import fs from 'fs-extra';
import electron from 'electron';
import Config from './Config';
import Platform from './Util/Platform';
import BrowserViewProxy from './BrowserViewProxy';
import {AppPath} from './AppPath';
import OpenDialogSyncOptions = Electron.OpenDialogSyncOptions;
import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;
import {Global} from './Global';

const app = electron.app;
const Menu = electron.Menu;
const powerSaveBlocker = electron.powerSaveBlocker;
const ipcMain = electron.ipcMain;
const BrowserView = electron.BrowserView;

// mac(no sign): ~/Library/Application Support/jasper
// mac(sign)   : ~/Library/Containers/io.jasperapp/data/Library/Application Support/jasper
// win         : ~\AppData\Roaming\jasper
const userDataPath = AppPath.getUserData();
const configDir = `${userDataPath}/io.jasperapp`;
const configPath = `${configDir}/config.json`;

Logger.n(`user data path: ${userDataPath}`);
Logger.n(`app data path: ${app.getPath('appData')}`);
Logger.n(`config path: ${configPath}`);

powerSaveBlocker.start('prevent-app-suspension');

process.on('unhandledRejection', (reason, p) => {
  Logger.e(`Unhandled Rejection at: ${p}`);
  Logger.e(`reason: ${reason}`);
});

let mainWindowPromiseResolver;
const mainWindowPromise = new Promise((_resolve)=> mainWindowPromiseResolver = _resolve);

let mainWindow = null;
let appMenu = null;
let minimumMenu = null;
electron.app.on('window-all-closed', async ()=>{
  await require('./Util/GA').default.eventAppEnd('app', 'end');
  electron.app.quit();
});

let skipReadIssue = 0;
let currentZoom = 1;

// handle that open with custom URL schema.
// jasperapp://stream?name=...&queries=...&color=...&notification=...
electron.app.on('will-finish-launching', () => {
  app.on('open-url', async (e, url) => {
    e.preventDefault();
    const urlObj = require('url').parse(url, true);

    if (urlObj.host === 'stream') {
      const stream = {
        name: urlObj.query.name || '',
        queries: urlObj.query.queries || '[]',
        notification: parseInt(urlObj.query.notification, 10),
        color: urlObj.query.color || ''
      };

      if (mainWindow) {
        mainWindow.webContents.send('create-new-stream', stream);
      } else {
        await mainWindowPromise;
        mainWindow.webContents.send('create-new-stream', stream);
      }
    }
  });
});

electron.app.on('ready', function() {
  const config = {
    width: 1280,
    height: 900,
    title: 'Jasper',
    icon: null,
    webPreferences: {
      nodeIntegration: true
    }
  };
  if (Platform.isLinux()) config.icon = `${__dirname}/Electron/image/icon.png`;
  // todo: remove global
  (global as any).mainWindow = mainWindow = new electron.BrowserWindow(config);
  Global.setMainWindow(mainWindow);

  mainWindow.on('closed', ()=> {
    mainWindow = null;
  });

  // prevent external web page
  mainWindow.webContents.on('will-navigate', (ev, _url)=> ev.preventDefault());

  // power save handling
  {
    electron.powerMonitor.on('suspend', () => {
      Logger.n(`power monitor: suspend`);
      // do nothing
    });

    electron.powerMonitor.on('resume', () => {
      Logger.n(`power monitor: resume`);
      restartAllStreams();
    });
  }

  // online/offline
  {
    ipcMain.on('online-status-changed', (_event, status) => {
      Logger.n(`network status: ${status}`);
      if (status === 'offline') {
        stopAllStreams();
        require('./Util/GA').default.setNetworkAvailable(false);
      } else {
        restartAllStreams();
        require('./Util/GA').default.setNetworkAvailable(true);
      }
    });
  }

  // Create the Application's main menu
  const template: MenuItemConstructorOptions[] = [
    {
      label: "Application",
      submenu: [
        { label: "About Jasper", click: showAbout },
        { type: "separator" },
        { label: "Preferences", accelerator: "CmdOrCtrl+,", click: showPreferences },
        { label: "Update", click: ()=>{electron.shell.openExternal('https://jasperapp.io/release.html')} },
        { type: "separator" },
        { label: 'Services', role: 'services' },
        { type: "separator" },
        { label: 'Hide Jasper', accelerator: 'CmdOrCtrl+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Option+CmdOrCtrl+H', role: 'hideOthers' },
        { label: 'Show All', role: 'unhide' },
        { type: "separator" },
        { label: "Quit Jasper", accelerator: "CmdOrCtrl+Q", click: quit}
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
        { label: 'Single Pane', accelerator: 'CmdOrCtrl+1', click: switchLayout.bind(null, 'single') },
        { label: 'Two Pane', accelerator: 'CmdOrCtrl+2', click: switchLayout.bind(null, 'two') },
        { label: 'Three Pane', accelerator: 'CmdOrCtrl+3', click: switchLayout.bind(null, 'three') },
        { type: "separator" },
        { label: 'Full Screen', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Streams',
      submenu: [
        { label: 'Next Stream', accelerator: 'D', click: commandWebContents.bind(null, 'app', 'next_stream')},
        { label: 'Prev Stream', accelerator: 'F', click: commandWebContents.bind(null, 'app', 'prev_stream')},
        { type: 'separator' },
        { label: 'LIBRARY', submenu: [
          { label: 'Inbox', accelerator: 'F1', click: commandWebContents.bind(null, 'app', 'load_inbox')},
          { label: 'Unread', accelerator: 'F2', click: commandWebContents.bind(null, 'app', 'load_unread')},
          { label: 'Open', accelerator: 'F3', click: commandWebContents.bind(null, 'app', 'load_open')},
          { label: 'Star', accelerator: 'F4', click: commandWebContents.bind(null, 'app', 'load_mark')},
          { label: 'Archive', accelerator: 'F5', click: commandWebContents.bind(null, 'app', 'load_archive')}
        ]},
        { label: 'SYSTEM', submenu: [
          { label: 'Me', accelerator: 'F6', click: commandWebContents.bind(null, 'app', 'load_me')},
          { label: 'Team', accelerator: 'F7', click: commandWebContents.bind(null, 'app', 'load_team')},
          { label: 'Watching', accelerator: 'F8', click: commandWebContents.bind(null, 'app', 'load_watching')},
          { label: 'Subscription', accelerator: 'F9', click: commandWebContents.bind(null, 'app', 'load_subscription')}
        ]},
        { label: 'STREAMS', submenu: [
          { label: '1st', accelerator: '1', click: commandWebContents.bind(null, 'app', 'load_1st')},
          { label: '2nd', accelerator: '2', click: commandWebContents.bind(null, 'app', 'load_2nd')},
          { label: '3rd', accelerator: '3', click: commandWebContents.bind(null, 'app', 'load_3rd')},
          { label: '4th', accelerator: '4', click: commandWebContents.bind(null, 'app', 'load_4th')},
          { label: '5th', accelerator: '5', click: commandWebContents.bind(null, 'app', 'load_5th')}
        ]},
        { type: 'separator' },
        { label: 'Restart Streams', accelerator: 'Alt+L', click: restartAllStreams }
      ]
    },
    {
      label: 'Issues',
      submenu: [
        { label: 'Load Issues', accelerator: '.', click: commandWebContents.bind(null, 'issues', 'load') },
        { type: 'separator' },
        { label: 'Next Issue', accelerator: 'J', click: commandWebContents.bind(null, 'issues', 'next') },
        { label: 'Prev Issue', accelerator: 'K', click: commandWebContents.bind(null, 'issues', 'prev') },
        { label: 'Skip Read(On/Off)', accelerator: 'Y', type: 'checkbox', click: ()=>{ skipReadIssue ^= 1 } },
        { type: 'separator' },
        { label: 'Toggle', submenu: [
          { label: 'Read', accelerator: 'I', click: commandWebContents.bind(null, 'webview', 'read') },
          { label: 'Star', accelerator: 'S', click: commandWebContents.bind(null, 'webview', 'mark') },
          { label: 'Archive', accelerator: 'E', click: commandWebContents.bind(null, 'webview', 'archive') }
        ]},
        { type: 'separator' },
        {label: 'Filter', submenu: [
          { label: 'Focus On', accelerator: '/', click: commandWebContents.bind(null, 'issues', 'focus_filter') },
          { label: 'Author', accelerator: 'A', click: commandWebContents.bind(null, 'issues', 'filter_author') },
          { label: 'Assignee', accelerator: 'N', click: commandWebContents.bind(null, 'issues', 'filter_assignee') },
          { label: 'Unread', accelerator: 'U', click: commandWebContents.bind(null, 'issues', 'filter_unread') },
          { label: 'Open', accelerator: 'O', click: commandWebContents.bind(null, 'issues', 'filter_open') },
          { label: 'Star', accelerator: 'M', click: commandWebContents.bind(null, 'issues', 'filter_mark') },
          { label: 'Clear', accelerator: 'C', click: commandWebContents.bind(null, 'issues', 'filter_clear') }
        ]},
        { type: 'separator' },
        { label: 'Open with External', accelerator: 'CmdOrCtrl+O', click: commandWebContents.bind(null, 'webview', 'export') }
      ]
    },
    {
      label: 'Page',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: commandWebContents.bind(null, 'webview', 'reload') },
        { label: 'Back', accelerator: 'CmdOrCtrl+[', click: commandWebContents.bind(null, 'webview', 'back') },
        { label: 'Forward', accelerator: 'CmdOrCtrl+]', click: commandWebContents.bind(null, 'webview', 'forward') },
        { type: 'separator' },
        { label: 'Scroll Down', accelerator: 'CmdOrCtrl+J', click: commandWebContents.bind(null, 'webview', 'scroll_down') },
        { label: 'Scroll Up', accelerator: 'CmdOrCtrl+K', click: commandWebContents.bind(null, 'webview', 'scroll_up') },
        { type: 'separator' },
        { label: 'Open Location', accelerator: 'CmdOrCtrl+L', click: commandWebContents.bind(null, 'webview', 'open_location') }
      ]
    },
    {
      label: 'Window', role: 'window',
      submenu: [
        {label: 'Zoom +', accelerator: 'CmdOrCtrl+Plus', click: zoom.bind(null, 0.05, false)},
        {label: 'Zoom -', accelerator: 'CmdOrCtrl+-', click: zoom.bind(null, -0.05, false)},
        {label: 'Zoom Reset', accelerator: 'CmdOrCtrl+0', click: zoom.bind(null, 1, true)},
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
        {label: 'DevTools(Main)', click: ()=>{ mainWindow.webContents.openDevTools({mode: 'detach'}); }},
        {label: 'DevTools(BrowserView)', click: ()=>{ BrowserViewProxy.openDevTools({mode: 'detach'}); }},
      ]
    }
  ];

  const minimumTemplate: MenuItemConstructorOptions[] = [
    {
      label: "Application",
      submenu: [
        { label: "About Jasper", click: showAbout },
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
        {label: 'DevTools', click: ()=>{ mainWindow.webContents.openDevTools(); }},
      ]
    }
  ];

  appMenu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(appMenu);

  minimumMenu = Menu.buildFromTemplate(minimumTemplate);

  ipcMain.on('keyboard-shortcut', (_ev, enable)=>{
    enableShortcut(appMenu.items[3], enable); // streams
    enableShortcut(appMenu.items[4], enable); // issues
    enableShortcut(appMenu.items[5], enable); // page
  });

  initialize(mainWindow).catch(e => console.log(e));
});

async function quit() {
  await require('./Util/GA').default.eventAppEnd('app', 'end');
  electron.app.exit(0);
}

async function initialize(mainWindow) {
  await initializeConfig();

  mainWindow.loadURL(`file://${__dirname}/Electron/html/index.html`);

  const Bootstrap = require('./Bootstrap.js').default;
  await Bootstrap.start();

  mainWindow.webContents.send('service-ready');

  const VersionChecker = require('./Checker/VersionChecker.js').default;
  VersionChecker.start(mainWindow);

  updateUnreadCountBadge();

  // focus / blur
  {
    let lastFocusedRestartTime = Date.now();

    mainWindow.on('focus', () => {
      require('./Util/GA').default.eventAppActive();

      // 最終restartから30分以上たっていたら、restartする
      const nowTime = Date.now();
      if (nowTime - lastFocusedRestartTime >= 1800000) {
        lastFocusedRestartTime = nowTime;
        Logger.d('[restart streams only polling by focused]');
        restartAllStreamsOnlyPolling();
      }
    });

    mainWindow.on('blur', () => {
      require('./Util/GA').default.eventAppDeActive();
    });
  }

  // setup browser view
  {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false
      }
    });

    mainWindow.setBrowserView(view);
    BrowserViewProxy.setBrowserView(view);
  }

  mainWindowPromiseResolver();
}

async function initializeConfig() {
  fs.ensureFileSync(configPath);
  const isConfig = !!fs.readJsonSync(configPath, {throws: false});
  if (!isConfig) {
    mainWindow.loadURL(`file://${__dirname}/Electron/html/setup/setup.html`);

    const promise = new Promise((resolve, reject)=>{
      ipcMain.on('apply-settings', (_ev, settings) =>{
        const configs = fs.readJsonSync(`${__dirname}/asset/config.json`);
        configs[0].github.accessToken = settings.accessToken;
        configs[0].github.host = settings.host;
        configs[0].github.pathPrefix = settings.pathPrefix;
        configs[0].github.webHost = settings.webHost;
        configs[0].github.https = settings.https;

        if (!configs[0].github.accessToken || !configs[0].github.host) {
          reject(new Error('invalid settings'));
          electron.app.quit();
          return;
        }

        fs.writeJsonSync(configPath, configs, {spaces: 2});
        resolve();
      });
    });

    Menu.setApplicationMenu(minimumMenu);
    await promise;
    Menu.setApplicationMenu(appMenu);
  }

  // migration: from v0.1.1
  {
    const configs = fs.readJsonSync(configPath);
    if (!('https' in configs[0].github)) {
      configs[0].github.https = true;
      fs.writeJsonSync(configPath, configs);
    }

    if (!('badge' in configs[0].general)) {
      configs[0].general.badge = false;
      fs.writeJsonSync(configPath, configs);
    }
  }

  // migration: to v0.2.1 from v0.2.0
  {
    const configs = fs.readJsonSync(configPath);
    if (!('alwaysOpenOutdated' in configs[0].general)) {
      configs[0].general.alwaysOpenOutdated = false;
      fs.writeJsonSync(configPath, configs);
    }
  }

  // migration: to v0.4.0
  {
    const configs = fs.readJsonSync(configPath);
    if (!('theme' in configs[0])) {
      for (const config of configs) config.theme = {main: null, browser: null};
      fs.writeJsonSync(configPath, configs, {spaces: 2});
    }
  }

  Config.initialize(configPath);
}

function restartAllStreams() {
  const Bootstrap = require('./Bootstrap.js').default;
  Bootstrap.restart();

  const VersionChecker = require('./Checker/VersionChecker.js').default;
  VersionChecker.restart(mainWindow);

  require('./Util/GA').default.eventMenu('restart-all-streams');
}

function restartAllStreamsOnlyPolling() {
  const Bootstrap = require('./Bootstrap.js').default;
  Bootstrap.restartOnlyPolling();
}

function stopAllStreams() {
  const Bootstrap = require('./Bootstrap.js').default;
  Bootstrap.stop();
}

function showPreferences() {
  const config = Config.activeConfig;
  const prefWindow = new electron.BrowserWindow({
    title: 'Preferences',
    width: 500,
    height: 350,
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
  prefWindow.loadURL(`file://${__dirname}/Electron/html/preferences/preferences.html`);
  ipcMain.once('fonts-ready', ()=>{
    prefWindow.show();
  });

  prefWindow.webContents.on('dom-ready', ()=>{
    prefWindow.webContents.send('current-config', config);
  });

  prefWindow.on('closed', ()=>{
    Menu.setApplicationMenu(appMenu);
  });

  ipcMain.on('apply-config', (_ev, newConfig) =>{
    ipcMain.removeAllListeners('apply-config');

    let isChanged = false;
    if (config.general.browser !== newConfig.general.browser) isChanged = true;
    if (config.general.notification !== newConfig.general.notification) isChanged = true;
    if (config.general.notificationSilent !== newConfig.general.notificationSilent) isChanged = true;
    if (config.general.onlyUnreadIssue !== newConfig.general.onlyUnreadIssue) isChanged = true;
    if (config.general.badge !== newConfig.general.badge) isChanged = true;
    if (config.general.alwaysOpenOutdated !== newConfig.general.alwaysOpenOutdated) isChanged = true;
    if (config.general.alwaysOpenExternalUrlInExternalBrowser !== newConfig.general.alwaysOpenExternalUrlInExternalBrowser) isChanged = true;
    if (config.database.max !== newConfig.database.max) isChanged = true;

    if (isChanged) apply();

    Menu.setApplicationMenu(appMenu);

    async function apply() {
      config.general = newConfig.general;
      config.database.max = newConfig.database.max;
      Config.updateConfig(Config.activeIndex, config);
    }
  });

  ipcMain.on('delete-all-data', async ()=>{
    ipcMain.removeAllListeners('apply-config');

    const Bootstrap = require('./Bootstrap.js').default;
    Bootstrap.stop();

    const DB = require('./DB/DB.js').default;
    await DB.close();

    try {
      fs.removeSync(userDataPath);
    } catch (e) {
      Logger.e(e);
      fs.removeSync(require('path').dirname(configPath));
    }

    electron.app.quit();
  });

  // save streams
  {
    ipcMain.removeAllListeners('save-streams');
    ipcMain.on('save-streams', async () =>{
      const defaultPath = app.getPath('downloads') + '/jasper-streams.json';
      const filePath = electron.dialog.showSaveDialog({defaultPath});
      if (!filePath) return;

      const output = await require('./Stream/SaveAndLoadStreams').default.save();
      fs.writeJsonSync(filePath, output, {spaces: 2});
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
      const data = fs.readJsonSync(filePath);
      await require('./Stream/SaveAndLoadStreams').default.load(data);
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
      const css = fs.readFileSync(filePath).toString();
      mainWindow.webContents.send('load-theme-main', css);

      // remove file
      if (Config.themeMainPath) fs.removeSync(Config.themeMainPath);

      // copy file
      const fileName = `theme-main-${Date.now()}.css`;
      fs.copySync(filePath, `${configDir}/${fileName}`);
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
      const css = fs.readFileSync(filePath).toString();
      mainWindow.webContents.send('load-theme-browser', css);

      // remove file
      if (Config.themeBrowserPath) fs.removeSync(Config.themeBrowserPath);

      // copy file
      const fileName = `theme-browser-${Date.now()}.css`;
      fs.copySync(filePath, `${configDir}/${fileName}`);
      config.theme.browser = `./${fileName}`;
      Config.updateConfig(Config.activeIndex, config);
    });

    ipcMain.on('load-theme-default', ()=>{
      if (Config.themeMainPath) fs.removeSync(Config.themeMainPath);
      if (Config.themeBrowserPath) fs.removeSync(Config.themeBrowserPath);

      config.theme.main = null;
      config.theme.browser = null;
      Config.updateConfig(Config.activeIndex, config);

      mainWindow.webContents.send('load-theme-main', '');
      mainWindow.webContents.send('load-theme-browser', '');
    });
  }

  Menu.setApplicationMenu(minimumMenu);
  prefWindow.setMenu(null);
}

function switchLayout(layout) {
  mainWindow.webContents.send('switch-layout', layout);
  require('./Util/GA').default.eventMenu(`layout:${layout}`);
}

function showAbout() {
  const aboutWindow = new electron.BrowserWindow({
    title: '',
    width: 275,
    height: 265,
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

  const version = electron.app.getVersion();
  aboutWindow.loadURL(`file://${__dirname}/Electron/html/about.html#${version}`);
  aboutWindow.once('ready-to-show', ()=>{
    aboutWindow.show();
  });
  aboutWindow.on('closed', ()=>{
    Menu.setApplicationMenu(appMenu);
  });
  Menu.setApplicationMenu(minimumMenu);
  aboutWindow.setMenu(null);
}

async function updateUnreadCountBadge() {
  if (!electron.app.dock) return;

  const DB = require('./DB/DB.js').default;
  const IssuesTable = require('./DB/IssuesTable.js').default;
  const Config = require('./Config.js').default;

  async function update() {
    if (!Config.generalBadge) {
      electron.app.dock.setBadge('');
      return;
    }

    const count = await IssuesTable.unreadCount();
    if (count === 0) {
      electron.app.dock.setBadge('');
    } else {
      electron.app.dock.setBadge(count + '');
    }
  }

  update();
  DB.addExecDoneListener(update);
}

function zoom(diffFactor, abs) {
  if (abs) {
    currentZoom = diffFactor;
  } else {
    currentZoom += diffFactor;
  }

  currentZoom = Math.max(currentZoom, 0.05);

  mainWindow.webContents.setZoomFactor(currentZoom);
  BrowserViewProxy.setZoomFactor(currentZoom);

  require('./Util/GA').default.eventMenu(`zoom:${currentZoom}`);
}

// target is webview|issues|streams
function commandWebContents(target, command) {
  // hack
  if (skipReadIssue && target === 'issues' && ['next', 'prev'].includes(command)) command = `${command}_with_skip`;

  mainWindow.webContents.send(`command-${target}`, {command});

  require('./Util/GA').default.eventMenu(`${target}:${command}`);
}

function enableShortcut(menu, enable) {
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
