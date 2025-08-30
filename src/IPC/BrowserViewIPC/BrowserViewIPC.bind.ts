import {ipcMain} from 'electron';
import {BrowserViewService} from '../../Main/Service/BrowserViewService';
import {BrowserViewIPCChannels} from './BrowserViewIPC.channel';

export function browserViewIPCBind() {
  ipcMain.handle(BrowserViewIPCChannels.loadURL, (_ev, url: string) => {
    return BrowserViewService.loadURL(url);
  });

  ipcMain.on(BrowserViewIPCChannels.getURL, ev => {
    ev.returnValue = BrowserViewService.getURL();
  });

  ipcMain.handle(BrowserViewIPCChannels.reload, () => {
    return BrowserViewService.reload();
  });

  ipcMain.on(BrowserViewIPCChannels.canGoBack, ev => {
    ev.returnValue = BrowserViewService.canGoBack();
  });

  ipcMain.on(BrowserViewIPCChannels.canGoForward, ev => {
    ev.returnValue = BrowserViewService.canGoForward();
  });

  ipcMain.handle(BrowserViewIPCChannels.goBack, () => {
    return BrowserViewService.goBack();
  });

  ipcMain.handle(BrowserViewIPCChannels.goForward, () => {
    return BrowserViewService.goForward();
  });

  ipcMain.handle(BrowserViewIPCChannels.focus, () => {
    return BrowserViewService.focus();
  });

  ipcMain.handle(BrowserViewIPCChannels.blur, () => {
    return BrowserViewService.blur();
  });

  ipcMain.on(BrowserViewIPCChannels.executeJavaScript, (_ev, js: string) => {
    return BrowserViewService.executeJavaScript(js);
  });

  ipcMain.on(BrowserViewIPCChannels.insertCSS, (_ev, css: string) => {
    return BrowserViewService.insertCSS(css);
  });

  ipcMain.on(BrowserViewIPCChannels.findInPage, (_ev, keyword: string, options?: Electron.FindInPageOptions) => {
    return BrowserViewService.findInPage(keyword, options);
  });

  ipcMain.on(BrowserViewIPCChannels.stopFindInPage, (_ev, action: string) => {
    return BrowserViewService.stopFindInPage(action);
  });

  ipcMain.on(BrowserViewIPCChannels.hide, (_ev, flag: boolean) => {
    return BrowserViewService.hide(flag);
  });

  ipcMain.on(BrowserViewIPCChannels.setRect, (_, x: number, y: number, width: number, height: number) => () => {
    return BrowserViewService.setRect(x, y, width, height);
  });

  ipcMain.on(BrowserViewIPCChannels.setBackgroundColor, (_, color: string) => {
    return BrowserViewService.setBackgroundColor(color);
  });
}
