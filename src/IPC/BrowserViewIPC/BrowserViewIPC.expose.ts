import {ipcRenderer} from 'electron';
import {BrowserViewIPCChannels} from './BrowserViewIPC.channel';

declare global {
  interface IPC {
    browserView: {
      loadURL: (url: string) => Promise<void>;
      getURL: () => string;
      reload: () => Promise<void>;
      canGoBack: () => boolean;
      canGoForward: () => boolean;
      goBack: () => Promise<void>;
      goForward: () => Promise<void>;
      focus: () => Promise<void>;
      blur: () => Promise<void>;
      executeJavaScript: (js: string) => Promise<void>;
      insertCSS: (css: string) => Promise<void>;
      findInPage: (keyword: string, options?: Electron.FindInPageOptions) => Promise<void>;
      stopFindInPage: (action: string) => Promise<void>;
      hide: (flag: boolean) => Promise<void>;
      setRect: (x: number, y: number, width: number, height: number) => Promise<void>;
      setBackgroundColor: (color: string) => Promise<void>;
    };
  }
}

export const browserViewIPCExpose = {
  ipc: {
    browserView: {
      loadURL: (url: string) => {
        return ipcRenderer.invoke(BrowserViewIPCChannels.loadURL, url);
      },

      getURL: () => {
        return ipcRenderer.sendSync(BrowserViewIPCChannels.getURL);
      },

      reload: () => {
        return ipcRenderer.invoke(BrowserViewIPCChannels.reload);
      },

      canGoBack: () => {
        return ipcRenderer.sendSync(BrowserViewIPCChannels.canGoBack);
      },

      canGoForward: () => {
        return ipcRenderer.sendSync(BrowserViewIPCChannels.canGoForward);
      },

      goBack: () => {
        return ipcRenderer.invoke(BrowserViewIPCChannels.goBack);
      },

      goForward: () => {
        return ipcRenderer.invoke(BrowserViewIPCChannels.goForward);
      },

      focus: () => {
        return ipcRenderer.invoke(BrowserViewIPCChannels.focus);
      },

      blur: () => {
        return ipcRenderer.invoke(BrowserViewIPCChannels.blur);
      },

      executeJavaScript: (js: string) => {
        return ipcRenderer.send(BrowserViewIPCChannels.executeJavaScript, js);
      },

      insertCSS: (css: string) => {
        return ipcRenderer.send(BrowserViewIPCChannels.insertCSS, css);
      },

      findInPage: (keyword: string, options?: Electron.FindInPageOptions) => {
        return ipcRenderer.send(BrowserViewIPCChannels.findInPage, keyword, options);
      },

      stopFindInPage: (action: string) => {
        return ipcRenderer.send(BrowserViewIPCChannels.findInPage, action);
      },

      hide: (flag: boolean) => {
        return ipcRenderer.send(BrowserViewIPCChannels.hide, flag);
      },

      setRect: (x: number, y: number, width: number, height: number) => {
        return ipcRenderer.send(BrowserViewIPCChannels.setRect, x, y, width, height);
      },

      setBackgroundColor: (color: string) => {
        return ipcRenderer.send(BrowserViewIPCChannels.setBackgroundColor, color);
      }
    }
  }
}
