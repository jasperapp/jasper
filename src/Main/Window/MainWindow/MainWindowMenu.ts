import {app, dialog, Menu, MenuItemConstructorOptions, Notification, shell,} from 'electron';
import {BrowserViewBind} from '../../Bind/BrowserViewBind';
import {MainWindow} from './MainWindow';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {IssueIPC} from '../../../IPC/IssueIPC';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {MainWindowIPC} from '../../../IPC/MainWindowIPC';
import {SQLiteBind} from '../../Bind/SQLiteBind';
import {UserPrefBind} from '../../Bind/UserPrefBind';

class _MainWindowMenu {
  private appMenu: Menu;
  private currentZoom: number = 1;

  async init() {
    if (!this.appMenu) this.buildMainMenu();
    Menu.setApplicationMenu(this.appMenu);
  }

  enableShortcut(enable: boolean) {
    // devtoolが開いてるときは強制的にoffにする
    if (MainWindow.getWindow().webContents.isDevToolsOpened()) enable = false;

    // 子windowがある場合は強制的にoffにする。子windowでショートカットが反応するのを防ぐため。
    if (MainWindow.getWindow().getChildWindows().length > 0) enable = false;

    setEnable(enable, this.appMenu);

    function setEnable(enable: boolean, menu: Menu) {
      for (const menuItem of menu.items) {
        // 1文字ショートカットのメニューのon/off
        if (menuItem.accelerator?.length === 1) menuItem.enabled = enable;
        // Spaceキーのon/off
        if (menuItem.accelerator === 'Space') menuItem.enabled = enable;
        // Shift + Jなどのメニューのon/off
        if (menuItem.accelerator?.includes('Shift+')) menuItem.enabled = enable;
        // 再帰
        if (menuItem.submenu) setEnable(enable, menuItem.submenu);
      }
    }
  }

  private async quit() {
    app.exit(0);
  }

  private zoom(diffFactor: number, abs: boolean) {
    if (abs) {
      this.currentZoom = diffFactor;
    } else {
      this.currentZoom += diffFactor;
    }

    this.currentZoom = Math.max(this.currentZoom, 0.05);

    MainWindow.getWindow().webContents.setZoomFactor(this.currentZoom);
    BrowserViewBind.setZoomFactor(this.currentZoom);
  }

  private openPrefDir() {
    const eachPaths = UserPrefBind.getEachPaths();
    shell.showItemInFolder(eachPaths.userPrefPath);
  }

  // @ts-ignore
  private deleteAllData() {
    const buttons = ['OK', 'Cancel'];
    const okId = buttons.findIndex(v => v === 'OK');
    const cancelId = buttons.findIndex(v => v === 'Cancel');
    const res = dialog.showMessageBoxSync(MainWindow.getWindow(), {
      type: 'warning',
      buttons,
      defaultId: cancelId,
      title: 'Delete All Data',
      message: 'Do you delete all data from Jasper?',
      cancelId,
    });

    if (res === okId) {
      UserPrefBind.deleteAllData();
      app.quit();
      app.relaunch();
    }
  }

  async vacuum() {
    const notification = new Notification({title: 'SQLite Vacuum', body: 'Running...'});
    notification.show();

    await StreamIPC.stopAllStreams();
    await SQLiteBind.exec('vacuum');
    await StreamIPC.restartAllStreams();

    notification.close();
  }

  private buildMainMenu() {
    const template: MenuItemConstructorOptions[] = [
      {
        label: "Application",
        submenu: [
          { label: "About Jasper", click: () => MainWindowIPC.showAbout() },
          { label: "Update", click: () => shell.openExternal('https://jasperapp.io/release.html') },
          { type: "separator" },
          { label: "Preferences", accelerator: "CmdOrCtrl+,", click: () => MainWindowIPC.showPref() },
          { type: "separator" },
          { label: "Export Data", click: () => MainWindowIPC.showExportData()},
          // { label: "Delete Data", click: () => this.deleteAllData()},
          { type: "separator" },
          { label: "Supporter", click: () => shell.openExternal('https://h13i32maru.jp/supporter/') },
          // { type: "separator" },
          // { label: 'Services', role: 'services' },
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
          { label: 'Paste and Match Style', accelerator: 'Shift+CmdOrCtrl+V', role: "pasteAndMatchStyle" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", role: "selectAll" }
        ]
      },
      {
        label: 'View',
        submenu: [
          {label: 'Jump Navigation', accelerator: 'CmdOrCtrl+K', click: () => MainWindowIPC.showJumpNavigation()},
          {label: 'Recently Reads', accelerator: 'CmdOrCtrl+E', click: () => MainWindowIPC.showRecentlyReads()},
          { type: "separator" },
          { label: 'Single Pane', accelerator: 'CmdOrCtrl+1', click: () => MainWindowIPC.toggleLayout('one') },
          { label: 'Two Pane', accelerator: 'CmdOrCtrl+2', click: () => MainWindowIPC.toggleLayout('two') },
          { label: 'Three Pane', accelerator: 'CmdOrCtrl+3', click: () => MainWindowIPC.toggleLayout('three') },
          { type: "separator" },
          { label: 'Full Screen', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Streams',
        submenu: [
          {label: 'Toggle Notification', accelerator: 'CmdOrCtrl+I', click: () => MainWindowIPC.toggleNotification()},
          { type: "separator" },
          { label: 'Next Stream', accelerator: 'D', click: () => StreamIPC.selectNextStream()},
          { label: 'Prev Stream', accelerator: 'F', click: () => StreamIPC.selectPrevStream()},
          { type: "separator" },
          // { label: 'LIBRARY', submenu: [
          //     { label: 'Inbox', accelerator: 'F1', click: () => StreamIPC.selectLibraryStreamInbox()},
          //     { label: 'Unread', accelerator: 'F2', click: () => StreamIPC.selectLibraryStreamUnread()},
          //     { label: 'Open', accelerator: 'F3', click: () => StreamIPC.selectLibraryStreamOpen()},
          //     { label: 'Bookmark', accelerator: 'F4', click: () => StreamIPC.selectLibraryStreamMark()},
          //     { label: 'Archived', accelerator: 'F5', click: () => StreamIPC.selectLibraryStreamArchived()}
          //   ]},
          // { label: 'SYSTEM', submenu: [
          //     { label: 'Me', accelerator: 'F6', click: () => StreamIPC.selectSystemStreamMe()},
          //     { label: 'Team', accelerator: 'F7', click: () => StreamIPC.selectSystemStreamTeam()},
          //     { label: 'Watching', accelerator: 'F8', click: () => StreamIPC.selectSystemStreamWatching()},
          //     { label: 'Subscription', accelerator: 'F9', click: () => StreamIPC.selectSystemStreamSubscription()}
          //   ]},
          { label: 'STREAMS', submenu: [
              { label: '1st', accelerator: '1', click: () => StreamIPC.selectUserStream(0)},
              { label: '2nd', accelerator: '2', click: () => StreamIPC.selectUserStream(1)},
              { label: '3rd', accelerator: '3', click: () => StreamIPC.selectUserStream(2)},
              { label: '4th', accelerator: '4', click: () => StreamIPC.selectUserStream(3)},
              { label: '5th', accelerator: '5', click: () => StreamIPC.selectUserStream(4)},
            ]},
        ]
      },
      {
        label: 'Issues',
        submenu: [
          { label: 'Reload Issues', accelerator: '.', click: () => IssueIPC.reloadIssues()},
          { type: 'separator' },
          {label: 'Select Issue', submenu: [
              { label: 'Next Issue', accelerator: 'J', click: (menuItem) => {
                  // キーリピートをスロットリングする
                  menuItem.enabled = false;
                  IssueIPC.selectNextIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
              }},
              { label: 'Prev Issue', accelerator: 'K', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueIPC.selectPrevIssue()
                  setTimeout(() => menuItem.enabled = true, 100);
              }},
              { type: 'separator' },
              { label: 'Next Unread Issue', accelerator: 'Shift+J', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueIPC.selectNextUnreadIssue()
                  setTimeout(() => menuItem.enabled = true, 100);
              }},
              { label: 'Prev Unread Issue', accelerator: 'Shift+K', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueIPC.selectPrevUnreadIssue()
                  setTimeout(() => menuItem.enabled = true, 100);
              }},
          ]},
          { type: 'separator' },
          { label: 'Issue State', submenu: [
              { label: 'Toggle Read', accelerator: 'I', click: () => IssueIPC.toggleRead()},
              { label: 'Toggle Bookmark', accelerator: 'B', click: () => IssueIPC.toggleMark()},
              { label: 'Toggle Archive', accelerator: 'E', click: () => IssueIPC.toggleArchive()}
            ]},
          { type: 'separator' },
          {label: 'Filter Issue', submenu: [
              { label: 'Filter Author', accelerator: 'A', click: () => IssueIPC.filterToggleAuthor()},
              { label: 'Filter Assignee', accelerator: 'N', click: () => IssueIPC.filterToggleAssignee()},
              { label: 'Filter Unread', accelerator: 'U', click: () => IssueIPC.filterToggleUnread()},
              { label: 'Filter Open', accelerator: 'O', click: () => IssueIPC.filterToggleOpen()},
              { label: 'Filter Bookmark', accelerator: 'M', click: () => IssueIPC.filterToggleMark()},
              // { label: 'Filter Focus On', accelerator: '/', click: () => IssueIPC.focusFilter()},
              // { label: 'Filter Clear', accelerator: 'C', click: () => IssueIPC.clearFilter()},
            ]},
        ]
      },
      {
        label: 'Browser',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => BrowserViewBind.getWebContents().reload() },
          { label: 'Back', accelerator: 'CmdOrCtrl+[', click: () => BrowserViewBind.getWebContents().goBack() },
          { label: 'Forward', accelerator: 'CmdOrCtrl+]', click: () => BrowserViewBind.getWebContents().goForward() },
          { type: 'separator' },
          {label: 'Scroll', submenu: [
            // note: spaceキーでのスクロールでsmoothするとちらつく（デフォルトの挙動とぶつかってる？)
            { label: 'Scroll Down', accelerator: 'Space', click: () => BrowserViewBind.scroll(60, 'auto')},
            { label: 'Scroll Up', accelerator: 'Shift+Space', click: () => BrowserViewBind.scroll(-60, 'auto') },
            { type: 'separator' },
            { label: 'Scroll Long Down', accelerator: 'Alt+J', click: () => BrowserViewBind.scroll(600, 'smooth')},
            { label: 'Scroll Long Up', accelerator: 'Alt+K', click: () => BrowserViewBind.scroll(-600, 'smooth') },
          ]},
          { type: 'separator' },
          { label: 'Search Keyword', accelerator: 'CmdOrCtrl+F', click: () => BrowserViewIPC.startSearch() },
          { type: 'separator' },
          { label: 'Open Location', accelerator: 'CmdOrCtrl+L', click: () => BrowserViewIPC.focusURLInput() },
          { label: 'Open with External', accelerator: 'CmdOrCtrl+O', click: () => BrowserViewIPC.openURLWithExternalBrowser() }
        ]
      },
      {
        label: 'Window', role: 'window',
        submenu: [
          {label: 'Zoom +', accelerator: 'CmdOrCtrl+Plus', click: this.zoom.bind(this, 0.05, false)},
          {label: 'Zoom -', accelerator: 'CmdOrCtrl+-', click: this.zoom.bind(this, -0.05, false)},
          {label: 'Zoom Reset', accelerator: 'CmdOrCtrl+0', click: this.zoom.bind(this, 1, true)},
          {type: "separator"},
          {label: 'Minimize', accelerator: 'CmdOrCtrl+M', role: 'minimize'},
          {label: 'Bring All to Front', role: 'front'}
        ]
      },
      {
        label: 'Help', role: 'help',
        submenu: [
          {label: 'Handbook', click: () => shell.openExternal('https://docs.jasperapp.io/')},
          {label: 'Feedback', click: ()=> shell.openExternal('https://github.com/jasperapp/jasper')}
        ]
      },
      {
        label: 'Dev',
        submenu: [
          {label: 'DevTools(Main)', click: () => MainWindow.getWindow().webContents.openDevTools({mode: 'detach'})},
          {label: 'DevTools(BrowserView)', click: () => BrowserViewBind.getWebContents().openDevTools({mode: 'detach'})},
          {type: 'separator' },
          {label: 'Open Data Directory', click: () => this.openPrefDir()},
          {type: 'separator' },
          {label: 'SQLite Vacuum', click: this.vacuum.bind(this)},
          // {type: 'separator' },
          // {label: 'Restart Streams', accelerator: 'Alt+L', click: () => StreamIPC.restartAllStreams()},
          // {label: 'Delete All Data', click: () => this.deleteAllData()},
        ]
      }
    ];

    this.appMenu = Menu.buildFromTemplate(template);
  }
}

export const MainWindowMenu = new _MainWindowMenu();
