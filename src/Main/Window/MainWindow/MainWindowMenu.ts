import {app, dialog, Menu, MenuItemConstructorOptions, Notification, shell,} from 'electron';
import {BrowserViewBind} from '../../Bind/BrowserViewBind';
import {MainWindow} from './MainWindow';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {IssueIPC} from '../../../IPC/IssueIPC';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {MainWindowIPC} from '../../../IPC/MainWindowIPC';
import {SQLiteBind} from '../../Bind/SQLiteBind';
import {UserPrefBind} from '../../Bind/UserPrefBind';
import {menuMc} from './MainWindowMenuTranslate';

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

    // フォーカスがあたっている子windowがある場合は強制的にoffにする。子windowでショートカットが反応するのを防ぐため。
    {
      const childWindows = MainWindow.getWindow().getChildWindows();
      const isActive = childWindows.some(w => w.isFocused());
      if (isActive) enable = false;
    }

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
        label: menuMc().app.title, role: 'appMenu',
        submenu: [
          {label: menuMc().app.about, click: () => MainWindowIPC.showAbout()},
          {label: menuMc().app.update, click: () => shell.openExternal('https://jasperapp.io/release.html')},
          {type: 'separator'},
          {label: menuMc().app.preference, accelerator: 'CmdOrCtrl+,', click: () => MainWindowIPC.showPref()},
          {type: 'separator'},
          {label: menuMc().app.export, click: () => MainWindowIPC.showExportData()},
          // { label: "Delete Data", click: () => this.deleteAllData()},
          {type: 'separator'},
          {label: menuMc().app.supporter, click: () => shell.openExternal('https://h13i32maru.jp/supporter/')},
          // { type: "separator" },
          // { label: 'Services', role: 'services' },
          {type: 'separator'},
          {label: menuMc().app.hide, accelerator: 'CmdOrCtrl+H', role: 'hide'},
          {label: menuMc().app.hideOther, accelerator: 'Option+CmdOrCtrl+H', role: 'hideOthers'},
          {label: menuMc().app.show, role: 'unhide'},
          {type: 'separator'},
          {label: menuMc().app.quit, accelerator: 'CmdOrCtrl+Q', click: this.quit.bind(this)}
        ]
      },
      {
        label: menuMc().edit.title, role: 'editMenu',
        submenu: [
          {label: menuMc().edit.undo, accelerator: 'CmdOrCtrl+Z', role: 'undo'},
          {label: menuMc().edit.redo, accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo'},
          {type: 'separator'},
          {label: menuMc().edit.cut, accelerator: 'CmdOrCtrl+X', role: 'cut'},
          {label: menuMc().edit.copy, accelerator: 'CmdOrCtrl+C', role: 'copy'},
          {label: menuMc().edit.paste, accelerator: 'CmdOrCtrl+V', role: 'paste'},
          {label: menuMc().edit.pasteStyle, accelerator: 'Shift+CmdOrCtrl+V', role: 'pasteAndMatchStyle'},
          {label: menuMc().edit.selectAll, accelerator: 'CmdOrCtrl+A', role: 'selectAll'}
        ]
      },
      {
        label: menuMc().view.title,
        submenu: [
          {label: menuMc().view.jump, accelerator: 'CmdOrCtrl+K', click: () => MainWindowIPC.showJumpNavigation()},
          {label: menuMc().view.recently, accelerator: 'CmdOrCtrl+E', click: () => MainWindowIPC.showRecentlyReads()},
          {type: 'separator'},
          {label: menuMc().view.pane.single, accelerator: 'CmdOrCtrl+1', click: () => MainWindowIPC.toggleLayout('one')},
          {label: menuMc().view.pane.two, accelerator: 'CmdOrCtrl+2', click: () => MainWindowIPC.toggleLayout('two')},
          {label: menuMc().view.pane.three, accelerator: 'CmdOrCtrl+3', click: () => MainWindowIPC.toggleLayout('three')},
          {type: 'separator'},
          {label: menuMc().view.fullScreen, role: 'togglefullscreen'}
        ]
      },
      {
        label: menuMc().streams.title,
        submenu: [
          {label: menuMc().streams.notification, accelerator: 'CmdOrCtrl+I', click: () => MainWindowIPC.toggleNotification()},
          {type: 'separator'},
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
          {
            label: menuMc().streams.select.title, submenu: [
              {label: menuMc().streams.select.next, accelerator: 'D', click: () => StreamIPC.selectNextStream()},
              {label: menuMc().streams.select.prev, accelerator: 'F', click: () => StreamIPC.selectPrevStream()},
              {type: 'separator'},
              {label: menuMc().streams.select.top1, accelerator: '1', click: () => StreamIPC.selectUserStream(0)},
              {label: menuMc().streams.select.top2, accelerator: '2', click: () => StreamIPC.selectUserStream(1)},
              {label: menuMc().streams.select.top3, accelerator: '3', click: () => StreamIPC.selectUserStream(2)},
              {label: menuMc().streams.select.top4, accelerator: '4', click: () => StreamIPC.selectUserStream(3)},
              {label: menuMc().streams.select.top5, accelerator: '5', click: () => StreamIPC.selectUserStream(4)},
            ]
          },
        ]
      },
      {
        label: menuMc().issues.title,
        submenu: [
          {label: menuMc().issues.reload, accelerator: '.', click: () => IssueIPC.reloadIssues()},
          {type: 'separator'},
          {
            label: menuMc().issues.select.title, submenu: [
              {
                label: menuMc().issues.select.next, accelerator: 'J', click: (menuItem) => {
                  // キーリピートをスロットリングする
                  menuItem.enabled = false;
                  IssueIPC.selectNextIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
              {
                label: menuMc().issues.select.prev, accelerator: 'K', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueIPC.selectPrevIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
              {type: 'separator'},
              {
                label: menuMc().issues.select.nextUnread, accelerator: 'Shift+J', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueIPC.selectNextUnreadIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
              {
                label: menuMc().issues.select.prevUnread, accelerator: 'Shift+K', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueIPC.selectPrevUnreadIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
            ]
          },
          {type: 'separator'},
          {
            label: menuMc().issues.state.title, submenu: [
              {label: menuMc().issues.state.read, accelerator: 'I', click: () => IssueIPC.toggleRead()},
              {label: menuMc().issues.state.bookmark, accelerator: 'B', click: () => IssueIPC.toggleMark()},
              {label: menuMc().issues.state.archive, accelerator: 'E', click: () => IssueIPC.toggleArchive()}
            ]
          },
          {type: 'separator'},
          {
            label: menuMc().issues.filter.title, submenu: [
              {label: menuMc().issues.filter.author, accelerator: 'A', click: () => IssueIPC.filterToggleAuthor()},
              {label: menuMc().issues.filter.assignee, accelerator: 'N', click: () => IssueIPC.filterToggleAssignee()},
              {label: menuMc().issues.filter.unread, accelerator: 'U', click: () => IssueIPC.filterToggleUnread()},
              {label: menuMc().issues.filter.open, accelerator: 'O', click: () => IssueIPC.filterToggleOpen()},
              {label: menuMc().issues.filter.bookmark, accelerator: 'M', click: () => IssueIPC.filterToggleMark()},
              // { label: 'Filter Focus On', accelerator: '/', click: () => IssueIPC.focusFilter()},
              // { label: 'Filter Clear', accelerator: 'C', click: () => IssueIPC.clearFilter()},
            ]
          },
        ]
      },
      {
        label: menuMc().browser.title,
        submenu: [
          {label: menuMc().browser.reload, accelerator: 'CmdOrCtrl+R', click: () => BrowserViewBind.getWebContents().reload()},
          {label: menuMc().browser.back, accelerator: 'CmdOrCtrl+[', click: () => BrowserViewBind.getWebContents().goBack()},
          {label: menuMc().browser.forward, accelerator: 'CmdOrCtrl+]', click: () => BrowserViewBind.getWebContents().goForward()},
          {type: 'separator'},
          {
            label: menuMc().browser.scroll.title, submenu: [
              // note: spaceキーでのスクロールでsmoothするとちらつく（デフォルトの挙動とぶつかってる？)
              {label: menuMc().browser.scroll.down, accelerator: 'Space', click: () => BrowserViewBind.scroll(60, 'auto')},
              {label: menuMc().browser.scroll.up, accelerator: 'Shift+Space', click: () => BrowserViewBind.scroll(-60, 'auto')},
              {type: 'separator'},
              {label: menuMc().browser.scroll.longDown, accelerator: 'Alt+J', click: () => BrowserViewBind.scroll(600, 'smooth')},
              {label: menuMc().browser.scroll.longUp, accelerator: 'Alt+K', click: () => BrowserViewBind.scroll(-600, 'smooth')},
            ]
          },
          {type: 'separator'},
          {label: menuMc().browser.search, accelerator: 'CmdOrCtrl+F', click: () => BrowserViewIPC.startSearch()},
          {type: 'separator'},
          {label: menuMc().browser.location, accelerator: 'CmdOrCtrl+L', click: () => BrowserViewIPC.focusURLInput()},
          {label: menuMc().browser.open, accelerator: 'CmdOrCtrl+O', click: () => BrowserViewIPC.openURLWithExternalBrowser()}
        ]
      },
      {
        label: menuMc().window.title, role: 'window',
        submenu: [
          {label: menuMc().window.zoom.in, accelerator: 'CmdOrCtrl+Plus', click: this.zoom.bind(this, 0.05, false)},
          {label: menuMc().window.zoom.out, accelerator: 'CmdOrCtrl+-', click: this.zoom.bind(this, -0.05, false)},
          {label: menuMc().window.zoom.reset, accelerator: 'CmdOrCtrl+0', click: this.zoom.bind(this, 1, true)},
          {type: 'separator'},
          {label: menuMc().window.close, role: 'close'},
          {label: menuMc().window.minimize, accelerator: 'CmdOrCtrl+M', role: 'minimize'},
          {label: menuMc().window.front, role: 'front'}
        ]
      },
      {
        label: menuMc().help.title, role: 'help',
        submenu: [
          {label: menuMc().help.handbook, click: () => shell.openExternal('https://docs.jasperapp.io/')},
          {label: menuMc().help.feedback, click: () => shell.openExternal('https://github.com/jasperapp/jasper')}
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
