import electron, {
  app,
  Menu,
  MenuItemConstructorOptions,
  shell
} from 'electron';
import {BrowserViewBind} from '../Bind/BrowserViewBind';
import {AppWindow} from './AppWindow';
import {DB} from '../Storage/DB';
import {StreamIPC} from '../../IPC/StreamIPC';
import {GAIPC} from '../../IPC/GAIPC';
import {UserPrefStorage} from '../Storage/UserPrefStorage';
import {IssueIPC} from '../../IPC/IssueIPC';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {AppIPC} from '../../IPC/AppIPC';

class _AppMenu {
  private appMenu: Menu;
  private currentZoom: number = 1;

  async init() {
    if (!this.appMenu) this.buildMainMenu();
    Menu.setApplicationMenu(this.appMenu);
  }

  enableShortcut(enable: boolean) {
    // devtoolが開いてるときは強制的にoffにする
    if (AppWindow.getWindow().webContents.isDevToolsOpened()) enable = false;

    setEnable(enable, this.appMenu)

    function setEnable(enable: boolean, menu: Menu) {
      for (const menuItem of menu.items) {
        // 1文字ショートカットのメニューのon/off
        if (menuItem.accelerator?.length === 1) menuItem.enabled = enable;
        if (menuItem.submenu) setEnable(enable, menuItem.submenu);
      }
    }
  }

  private async quit() {
    GAIPC.eventAppEnd();
    app.exit(0);
  }

  // private switchLayout(layout: 'single' | 'two' | 'three') {
  //   AppWindow.getWindow().webContents.send('switch-layout', layout);
  //   GAIPC.eventMenu(`layout:${layout}`);
  // }
  //
  // private commandWebContents(target: 'app', command: string) {
  //   AppWindow.getWindow().webContents.send(`command-${target}`, {command});
  //   GAIPC.eventMenu(`${target}:${command}`);
  // }

  private zoom(diffFactor: number, abs: boolean) {
    if (abs) {
      this.currentZoom = diffFactor;
    } else {
      this.currentZoom += diffFactor;
    }

    this.currentZoom = Math.max(this.currentZoom, 0.05);

    AppWindow.getWindow().webContents.setZoomFactor(this.currentZoom);
    BrowserViewBind.setZoomFactor(this.currentZoom);

    GAIPC.eventMenu(`zoom:${this.currentZoom}`);
  }

  private openPrefDir() {
    shell.showItemInFolder(UserPrefStorage.getPrefPath());
  }

  async vacuum() {
    const notification = new electron.Notification({title: 'SQLite Vacuum', body: 'Running...'});
    notification.show();

    await StreamIPC.stopAllStreams();
    await DB.exec('vacuum');
    await StreamIPC.restartAllStreams();

    notification.close();
  }

  private buildMainMenu() {
    const template: MenuItemConstructorOptions[] = [
      {
        label: "Application",
        submenu: [
          { label: "About Jasper", click: () => AppIPC.showAbout() },
          { type: "separator" },
          { label: "Preferences", accelerator: "CmdOrCtrl+,", click: () => AppIPC.showPref() },
          { label: "Update", click: () => shell.openExternal('https://jasperapp.io/release.html') },
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
          { label: 'Single Pane', accelerator: 'CmdOrCtrl+1', click: () => AppIPC.toggleLayout('one') },
          { label: 'Two Pane', accelerator: 'CmdOrCtrl+2', click: () => AppIPC.toggleLayout('two') },
          { label: 'Three Pane', accelerator: 'CmdOrCtrl+3', click: () => AppIPC.toggleLayout('three') },
          { type: "separator" },
          { label: 'Full Screen', role: 'togglefullscreen' }
        ]
      },
      {
        label: 'Streams',
        submenu: [
          // { label: 'Next Stream', accelerator: 'D', click: () => StreamIPC.selectNextStream()},
          // { label: 'Prev Stream', accelerator: 'F', click: () => StreamIPC.selectPrevStream()},
          // { type: 'separator' },
          { label: 'LIBRARY', submenu: [
              { label: 'Inbox', accelerator: 'F1', click: () => StreamIPC.selectLibraryStreamInbox()},
              { label: 'Unread', accelerator: 'F2', click: () => StreamIPC.selectLibraryStreamUnread()},
              { label: 'Open', accelerator: 'F3', click: () => StreamIPC.selectLibraryStreamOpen()},
              { label: 'Bookmark', accelerator: 'F4', click: () => StreamIPC.selectLibraryStreamMark()},
              { label: 'Archived', accelerator: 'F5', click: () => StreamIPC.selectLibraryStreamArchived()}
            ]},
          { label: 'SYSTEM', submenu: [
              { label: 'Me', accelerator: 'F6', click: () => StreamIPC.selectSystemStreamMe()},
              { label: 'Team', accelerator: 'F7', click: () => StreamIPC.selectSystemStreamTeam()},
              { label: 'Watching', accelerator: 'F8', click: () => StreamIPC.selectSystemStreamWatching()},
              { label: 'Subscription', accelerator: 'F9', click: () => StreamIPC.selectSystemStreamSubscription()}
            ]},
          { label: 'STREAMS', submenu: [
              { label: '1st', accelerator: '1', click: () => StreamIPC.selectUserStream(0)},
              { label: '2nd', accelerator: '2', click: () => StreamIPC.selectUserStream(1)},
              { label: '3rd', accelerator: '3', click: () => StreamIPC.selectUserStream(2)},
              { label: '4th', accelerator: '4', click: () => StreamIPC.selectUserStream(3)},
              { label: '5th', accelerator: '5', click: () => StreamIPC.selectUserStream(4)},
            ]},
          { type: 'separator' },
          { label: 'Restart Streams', accelerator: 'Alt+L', click: () => StreamIPC.restartAllStreams() }
        ]
      },
      {
        label: 'Issues',
        submenu: [
          { label: 'Load Issues', accelerator: '.', click: () => IssueIPC.reloadIssues()},
          { type: 'separator' },
          {label: 'Select Issue', submenu: [
              { label: 'Next Issue', accelerator: 'J', click: () => IssueIPC.selectNextIssue()},
              { label: 'Next Unread Issue', accelerator: 'Shift+J', click: () => IssueIPC.selectNextUnreadIssue()},
              { label: 'Prev Issue', accelerator: 'K', click: () => IssueIPC.selectPrevIssue()},
              { label: 'Prev Unread Issue', accelerator: 'Shift+K', click: () => IssueIPC.selectPrevUnreadIssue()},
          ]},
          { type: 'separator' },
          { label: 'Toggle State', submenu: [
              { label: 'Read', accelerator: 'I', click: () => IssueIPC.toggleRead()},
              { label: 'Bookmark', accelerator: 'B', click: () => IssueIPC.toggleMark()},
              { label: 'Archive', accelerator: 'E', click: () => IssueIPC.toggleArchive()}
            ]},
          { type: 'separator' },
          {label: 'Toggle Filter', submenu: [
              { label: 'Author', accelerator: 'A', click: () => IssueIPC.filterToggleAuthor()},
              { label: 'Assignee', accelerator: 'N', click: () => IssueIPC.filterToggleAssignee()},
              { label: 'Unread', accelerator: 'U', click: () => IssueIPC.filterToggleUnread()},
              { label: 'Open', accelerator: 'O', click: () => IssueIPC.filterToggleOpen()},
              { label: 'Bookmark', accelerator: 'M', click: () => IssueIPC.filterToggleMark()},
              { label: 'Focus On', accelerator: '/', click: () => IssueIPC.focusFilter()},
              { label: 'Clear', accelerator: 'C', click: () => IssueIPC.clearFilter()},
            ]},
          { type: 'separator' },
          { label: 'Open with External', accelerator: 'CmdOrCtrl+O', click: () => IssueIPC.openIssueURLWithExternalBrowser() }
        ]
      },
      {
        label: 'Page',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => BrowserViewBind.getWebContents().reload() },
          { label: 'Back', accelerator: 'CmdOrCtrl+[', click: () => BrowserViewBind.getWebContents().goBack() },
          { label: 'Forward', accelerator: 'CmdOrCtrl+]', click: () => BrowserViewBind.getWebContents().goForward() },
          { type: 'separator' },
          { label: 'Scroll Down', accelerator: 'CmdOrCtrl+J', click: () => BrowserViewBind.scrollDown()},
          { label: 'Scroll Up', accelerator: 'CmdOrCtrl+K', click: () => BrowserViewBind.scrollUp() },
          { type: 'separator' },
          { label: 'Search Keyword', accelerator: 'CmdOrCtrl+F', click: () => BrowserViewIPC.startSearch() },
          { type: 'separator' },
          { label: 'Open Location', accelerator: 'CmdOrCtrl+L', click: () => BrowserViewIPC.focusURLInput() }
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
              {label: 'Library', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#library')},
              {label: 'System', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#your-issues')},
              {label: 'Stream', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#stream')},
              {label: 'Filter', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#filter')},
              {label: 'Sort', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#sort')},
              {label: 'Issue', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#issue')},
              {label: 'Shortcut Key', click: ()=> shell.openExternal('https://jasperapp.io/doc.html#shortcut')}
            ]},
          {label: 'FAQ', click: ()=> shell.openExternal('https://jasperapp.io/faq.html')},
          {label: 'Feedback', click: ()=> shell.openExternal('https://github.com/jasperapp/jasper')}
        ]
      },
      {
        label: 'Dev',
        submenu: [
          {label: 'DevTools(Main)', click: ()=>{ AppWindow.getWindow().webContents.openDevTools({mode: 'detach'}); }},
          {label: 'DevTools(BrowserView)', click: ()=>{ BrowserViewBind.getWebContents().openDevTools({mode: 'detach'}); }},
          { type: 'separator' },
          {label: 'Open Pref Directory', click: this.openPrefDir.bind(this)},
          {label: 'SQLite Vacuum', click: this.vacuum.bind(this)},
        ]
      }
    ];

    this.appMenu = Menu.buildFromTemplate(template);
  }
}

export const AppMenu = new _AppMenu();
