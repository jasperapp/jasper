import {BrowserWindow} from 'electron';
import {AppWindow} from '../Window/AppWindow';

class _GitHubWindowUtil {
  create(webHost: string, https: boolean): BrowserWindow {
    const githubWindow = new BrowserWindow({
      center: true,
      width: 1024,
      height: 800,
      parent: AppWindow.getWindow(),
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

export const GitHubWindowUtil = new _GitHubWindowUtil();
