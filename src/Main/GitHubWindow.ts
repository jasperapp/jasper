import {BrowserWindow} from 'electron';
import {Global} from '../Global';

class _GitHubWindow {
  create(webHost: string, https: boolean): BrowserWindow {
    const githubWindow = new BrowserWindow({
      center: true,
      width: 1024,
      height: 800,
      parent: Global.getMainWindow(),
      alwaysOnTop: true,
    });

    githubWindow.webContents.on('did-finish-load', () => {
      const url = new URL(githubWindow.webContents.getURL());
      githubWindow.setTitle(url.origin);
    });

    const url = `http${https ? 's' : ''}://${webHost}`;
    githubWindow.loadURL(url);
    return githubWindow;
  }
}

export const GitHubWindow = new _GitHubWindow();
