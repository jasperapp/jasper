import BrowserWindow = Electron.BrowserWindow;

class _AppWindow {
  private mainWindow: BrowserWindow;

  setWindow(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  getWindow() {
    return this.mainWindow;
  }
}

export const AppWindow = new _AppWindow();
