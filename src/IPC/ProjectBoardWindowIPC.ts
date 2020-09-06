import {BrowserWindow, ipcMain, ipcRenderer} from 'electron';

enum Channels {
  open = 'ProjectBoardWindowIPC:open',
  close = 'ProjectBoardWindowIPC:close',
  eventConsoleMessage = 'ProjectBoardWindowIPC:eventConsoleMessage',
}

class _ProjectBoardWindowIPC {
  private window: BrowserWindow;

  initWindow(window: BrowserWindow) {
    this.window = window;
  }

  // open
  async open(url: string, title: string, js: string, css: string) {
    return ipcRenderer.invoke(Channels.open, url, title, js, css);
  }

  onOpen(handler: (_ev, url: string, title: string, js: string, css: string) => Promise<void>) {
    ipcMain.handle(Channels.open, handler);
  }

  // close
  async close() {
    return ipcRenderer.invoke(Channels.close);
  }

  onClose(handler: () => Promise<void>) {
    ipcMain.handle(Channels.close, handler);
  }

  // event console-message
  eventConsoleMessage(level: number, message: string) {
    this.window.webContents.send(Channels.eventConsoleMessage, level, message);
  }

  onEventConsoleMessage(handler: (level: number, message: string) => void) {
    ipcRenderer.on(Channels.eventConsoleMessage, (_ev, level, message) => handler(level, message));
  }
}

export const ProjectBoardWindowIPC = new _ProjectBoardWindowIPC()
