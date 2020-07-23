import BrowserWindow = Electron.BrowserWindow;

class _Global {
  private mainWindow: BrowserWindow;

  setMainWindow(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  getMainWindow() {
    return this.mainWindow;
  }
}

export const Global = new _Global();
