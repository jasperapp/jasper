import {BrowserWindow, screen} from 'electron';
import {AppWindow} from './AppWindow';
import {ProjectBoardWindowIPC} from '../../IPC/ProjectBoardWindowIPC';
import {AppMenu} from './AppMenu';

class _ProjectBoardWindow {
  private window: BrowserWindow;

  bindIPC() {
    ProjectBoardWindowIPC.initWindow(AppWindow.getWindow());

    ProjectBoardWindowIPC.onOpen(async (_ev, url, title, js) => ProjectBoardWindow.open(url, title, js));
    ProjectBoardWindowIPC.onClose(async () => ProjectBoardWindow.close());
  }

  async open(url: string, title: string, js: string) {
    if (!this.window) this.createWindow();

    this.window.setTitle(title);
    this.window.show();
    this.window.focus();

    if (url !== this.window.webContents.getURL()) {
      await this.window.loadURL(url);
    }
    await this.window.webContents.executeJavaScript(js);
  }

  close() {
    if (this.window) {
      this.window.close();
      this.window = null;
    }
  }

  private createWindow() {
    this.window = new BrowserWindow();

    const offsetX = 220; // 220px is SideColumn width
    const rect1 = this.getCenterOnMainWindow(0.6, offsetX);
    const rect2 = this.getCenterOnMainWindow(1, offsetX);
    this.window.setBounds(rect1);
    this.window.setBounds(rect2, true);

    this.window.on('close', (_ev) => {
      this.window = null;
      AppMenu.enableMenus(true);
    });

    this.window.on('focus', () => AppMenu.enableMenus(false));
    this.window.on('blur', () => AppMenu.enableMenus(true));

    this.window.webContents.addListener('console-message', (_ev, level, message) => ProjectBoardWindowIPC.eventConsoleMessage(level, message));
  }

  private getCenterOnMainWindow(scale: number, offsetX: number): {width: number, height: number, x: number, y: number} {
    const mainWindow = AppWindow.getWindow();
    const mainWindowSize = mainWindow.getSize();
    const mainWindowPos = mainWindow.getPosition();
    let width = Math.floor(mainWindowSize[0] * scale);
    const height = Math.floor(mainWindowSize[1] * scale);
    const x = offsetX + Math.floor(mainWindowPos[0] + (mainWindowSize[0] / 2 - width / 2));
    const y = Math.floor(mainWindowPos[1] + (mainWindowSize[1] / 2 - height / 2));
    width = width - offsetX;

    const display = screen.getDisplayNearestPoint({x, y});
    if (width + x > display.workAreaSize.width) {
      width = display.workAreaSize.width - x;
    }

    return {width, height, x, y};
  }

  openDevTools() {
    this.window?.webContents.openDevTools({mode: 'detach'});
  }
}

export const ProjectBoardWindow = new _ProjectBoardWindow();
