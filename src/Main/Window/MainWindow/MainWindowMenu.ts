import {app, dialog, Menu, MenuItemConstructorOptions, Notification, shell,} from 'electron';
import {BrowserViewService} from '../../Service/BrowserViewService';
import {IssueService} from '../../Service/IssueService';
import {MainWindowService} from '../../Service/MainWindowService';
import {SQLiteService} from '../../Service/SQLiteService';
import {StreamService} from '../../Service/StreamService';
import {UserPrefService} from '../../Service/UserPrefService';
import {MainWindow} from './MainWindow';
import {mainWindowMc} from './MainWindowTranslate';

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
    BrowserViewService.setZoomFactor(this.currentZoom);
  }

  private openPrefDir() {
    const eachPaths = UserPrefService.getEachPaths();
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
      UserPrefService.deleteAllData();
      app.quit();
      app.relaunch();
    }
  }

  async vacuum() {
    const notification = new Notification({title: 'SQLite Vacuum', body: 'Running...'});
    notification.show();

    await StreamService.stopAllStreams();
    await SQLiteService.exec('vacuum');
    await StreamService.restartAllStreams();

    notification.close();
  }

  private buildMainMenu() {
    const template: MenuItemConstructorOptions[] = [
      {
        label: mainWindowMc().app.title, role: 'appMenu',
        submenu: [
          {label: mainWindowMc().app.about, click: () => MainWindowService.showAbout()},
          {label: mainWindowMc().app.update, click: () => shell.openExternal('https://jasperapp.io/release.html')},
          {type: 'separator'},
          {label: mainWindowMc().app.preference, accelerator: 'CmdOrCtrl+,', click: () => MainWindowService.showPref()},
          {type: 'separator'},
          {label: mainWindowMc().app.export, click: () => MainWindowService.showExportData()},
          // { label: "Delete Data", click: () => this.deleteAllData()},
          {type: 'separator'},
          {label: mainWindowMc().app.supporter, click: () => shell.openExternal('https://github.com/sponsors/h13i32maru')},
          {type: 'separator'},
          {label: mainWindowMc().app.hide, role: 'hide'},
          {label: mainWindowMc().app.hideOther, role: 'hideOthers'},
          {label: mainWindowMc().app.show, role: 'unhide'},
          {type: 'separator'},
          {label: mainWindowMc().app.quit, role: 'quit', click: this.quit.bind(this)}
        ]
      },
      {
        label: mainWindowMc().edit.title, role: 'editMenu',
        submenu: [
          {label: mainWindowMc().edit.undo, role: 'undo'},
          {label: mainWindowMc().edit.redo, role: 'redo'},
          {type: 'separator'},
          {label: mainWindowMc().edit.cut, role: 'cut'},
          {label: mainWindowMc().edit.copy, role: 'copy'},
          {label: mainWindowMc().edit.paste, role: 'paste'},
          {label: mainWindowMc().edit.pasteStyle, role: 'pasteAndMatchStyle'},
          {label: mainWindowMc().edit.selectAll, role: 'selectAll'}
        ]
      },
      {
        label: mainWindowMc().view.title,
        submenu: [
          {label: mainWindowMc().view.jump, accelerator: 'CmdOrCtrl+K', click: () => MainWindowService.showJumpNavigation()},
          {label: mainWindowMc().view.recently, accelerator: 'CmdOrCtrl+E', click: () => MainWindowService.showRecentlyReads()},
          {type: 'separator'},
          {label: mainWindowMc().view.pane.single, accelerator: 'CmdOrCtrl+1', click: () => MainWindowService.toggleLayout('one')},
          {label: mainWindowMc().view.pane.two, accelerator: 'CmdOrCtrl+2', click: () => MainWindowService.toggleLayout('two')},
          {label: mainWindowMc().view.pane.three, accelerator: 'CmdOrCtrl+3', click: () => MainWindowService.toggleLayout('three')},
          {type: 'separator'},
          {label: mainWindowMc().view.fullScreen, role: 'togglefullscreen'}
        ]
      },
      {
        label: mainWindowMc().streams.title,
        submenu: [
          {label: mainWindowMc().streams.notification, accelerator: 'CmdOrCtrl+I', click: () => MainWindowService.toggleNotification()},
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
            label: mainWindowMc().streams.select.title, submenu: [
              {label: mainWindowMc().streams.select.next, accelerator: 'D', click: () => StreamService.selectNextStream()},
              {label: mainWindowMc().streams.select.prev, accelerator: 'F', click: () => StreamService.selectPrevStream()},
              {type: 'separator'},
              {label: mainWindowMc().streams.select.top1, accelerator: '1', click: () => StreamService.selectUserStream(0)},
              {label: mainWindowMc().streams.select.top2, accelerator: '2', click: () => StreamService.selectUserStream(1)},
              {label: mainWindowMc().streams.select.top3, accelerator: '3', click: () => StreamService.selectUserStream(2)},
              {label: mainWindowMc().streams.select.top4, accelerator: '4', click: () => StreamService.selectUserStream(3)},
              {label: mainWindowMc().streams.select.top5, accelerator: '5', click: () => StreamService.selectUserStream(4)},
            ]
          },
        ]
      },
      {
        label: mainWindowMc().issues.title,
        submenu: [
          {label: mainWindowMc().issues.reload, accelerator: '.', click: () => IssueService.reloadIssues()},
          {type: 'separator'},
          {
            label: mainWindowMc().issues.select.title, submenu: [
              {
                label: mainWindowMc().issues.select.next, accelerator: 'J', click: (menuItem) => {
                  // キーリピートをスロットリングする
                  menuItem.enabled = false;
                  IssueService.selectNextIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
              {
                label: mainWindowMc().issues.select.prev, accelerator: 'K', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueService.selectPrevIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
              {type: 'separator'},
              {
                label: mainWindowMc().issues.select.nextUnread, accelerator: 'Shift+J', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueService.selectNextUnreadIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
              {
                label: mainWindowMc().issues.select.prevUnread, accelerator: 'Shift+K', click: (menuItem) => {
                  menuItem.enabled = false;
                  IssueService.selectPrevUnreadIssue();
                  setTimeout(() => menuItem.enabled = true, 100);
                }
              },
            ]
          },
          {type: 'separator'},
          {
            label: mainWindowMc().issues.state.title, submenu: [
              {label: mainWindowMc().issues.state.read, accelerator: 'I', click: () => IssueService.toggleRead()},
              {label: mainWindowMc().issues.state.bookmark, accelerator: 'B', click: () => IssueService.toggleMark()},
              {label: mainWindowMc().issues.state.archive, accelerator: 'E', click: () => IssueService.toggleArchive()}
            ]
          },
          {type: 'separator'},
          {
            label: mainWindowMc().issues.filter.title, submenu: [
              {label: mainWindowMc().issues.filter.author, accelerator: 'A', click: () => IssueService.filterToggleAuthor()},
              {label: mainWindowMc().issues.filter.assignee, accelerator: 'N', click: () => IssueService.filterToggleAssignee()},
              {label: mainWindowMc().issues.filter.unread, accelerator: 'U', click: () => IssueService.filterToggleUnread()},
              {label: mainWindowMc().issues.filter.open, accelerator: 'O', click: () => IssueService.filterToggleOpen()},
              {label: mainWindowMc().issues.filter.bookmark, accelerator: 'M', click: () => IssueService.filterToggleMark()},
              // { label: 'Filter Focus On', accelerator: '/', click: () => IssueIPC.focusFilter()},
              // { label: 'Filter Clear', accelerator: 'C', click: () => IssueIPC.clearFilter()},
            ]
          },
        ]
      },
      {
        label: mainWindowMc().browser.title,
        submenu: [
          {label: mainWindowMc().browser.reload, accelerator: 'CmdOrCtrl+R', click: () => BrowserViewService.getWebContents().reload()},
          {label: mainWindowMc().browser.back, accelerator: 'CmdOrCtrl+[', click: () => BrowserViewService.getWebContents().goBack()},
          {label: mainWindowMc().browser.forward, accelerator: 'CmdOrCtrl+]', click: () => BrowserViewService.getWebContents().goForward()},
          {type: 'separator'},
          {
            label: mainWindowMc().browser.scroll.title, submenu: [
              // note: spaceキーでのスクロールでsmoothするとちらつく（デフォルトの挙動とぶつかってる？)
              {label: mainWindowMc().browser.scroll.down, accelerator: 'Space', click: () => BrowserViewService.scroll(60, 'auto')},
              {label: mainWindowMc().browser.scroll.up, accelerator: 'Shift+Space', click: () => BrowserViewService.scroll(-60, 'auto')},
              {type: 'separator'},
              {label: mainWindowMc().browser.scroll.longDown, accelerator: 'Alt+J', click: () => BrowserViewService.scroll(600, 'smooth')},
              {label: mainWindowMc().browser.scroll.longUp, accelerator: 'Alt+K', click: () => BrowserViewService.scroll(-600, 'smooth')},
            ]
          },
          {type: 'separator'},
          {label: mainWindowMc().browser.search, accelerator: 'CmdOrCtrl+F', click: () => BrowserViewService.startSearch()},
          {type: 'separator'},
          {label: mainWindowMc().browser.location, accelerator: 'CmdOrCtrl+L', click: () => BrowserViewService.focusURLInput()},
          {label: mainWindowMc().browser.open, accelerator: 'CmdOrCtrl+O', click: () => BrowserViewService.openURLWithExternalBrowser()}
        ]
      },
      {
        label: mainWindowMc().window.title, role: 'window',
        submenu: [
          {label: mainWindowMc().window.zoom.in, accelerator: 'CmdOrCtrl+Plus', click: this.zoom.bind(this, 0.05, false)},
          {label: mainWindowMc().window.zoom.out, accelerator: 'CmdOrCtrl+-', click: this.zoom.bind(this, -0.05, false)},
          {label: mainWindowMc().window.zoom.reset, accelerator: 'CmdOrCtrl+0', click: this.zoom.bind(this, 1, true)},
          {type: 'separator'},
          {label: mainWindowMc().window.close, role: 'close'},
          {label: mainWindowMc().window.minimize, accelerator: 'CmdOrCtrl+M', role: 'minimize'},
          {label: mainWindowMc().window.front, role: 'front'}
        ]
      },
      {
        label: mainWindowMc().help.title, role: 'help',
        submenu: [
          {label: mainWindowMc().help.handbook, click: () => shell.openExternal('https://docs.jasperapp.io/')},
          {label: mainWindowMc().help.feedback, click: () => shell.openExternal('https://github.com/jasperapp/jasper')}
        ]
      },
      {
        label: 'Dev',
        submenu: [
          {label: 'DevTools(Main)', click: () => MainWindow.getWindow().webContents.openDevTools({mode: 'detach'})},
          {label: 'DevTools(BrowserView)', click: () => BrowserViewService.getWebContents().openDevTools({mode: 'detach'})},
          {type: 'separator'},
          {label: 'Open Data Directory', click: () => this.openPrefDir()},
          {type: 'separator'},
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
