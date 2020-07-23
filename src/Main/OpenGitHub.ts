import {BrowserWindow} from 'electron';
import {ConfigType} from '../Type/ConfigType';

class _OpenGitHub {
  open(config: ConfigType['github'], parentWindow: BrowserWindow) {
    const githubWindow = new BrowserWindow({
      center: true,
      width: 1024,
      height: 800,
      parent: parentWindow,
      alwaysOnTop: true,
    });

    githubWindow.webContents.on('did-finish-load', () => {
      const url = new URL(githubWindow.webContents.getURL());
      githubWindow.setTitle(url.origin);
    });

    const url = `http${config.https ? 's' : ''}://${config.webHost}`;
    githubWindow.loadURL(url);
    return githubWindow;
  }
}

export const OpenGitHub = new _OpenGitHub();
