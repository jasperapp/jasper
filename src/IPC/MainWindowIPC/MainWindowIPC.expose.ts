import {ipcRenderer} from 'electron';
import {MainWindowIPCChannels} from './MainWindowIPC.channel';

declare global {
  interface IPC {
    mainWindow: {
      reload: () => Promise<void>;
      isSystemDarkTheme: () => boolean;
      toggleMaximizeWindow: () => Promise<void>;
      openNewWindow: (url: string) => Promise<void>;
      keyboardShortcut: (enable: boolean) => Promise<void>;
    },
  }
}

export const mainWindowExpose = {
  ipc: {
    mainWindow: {
      reload: () => {
        return ipcRenderer.invoke(MainWindowIPCChannels.reload);
      },

      isSystemDarkTheme: () => {
        return ipcRenderer.sendSync(MainWindowIPCChannels.isSystemDarkTheme);
      },

      toggleMaximizeWindow: () => {
        return ipcRenderer.invoke(MainWindowIPCChannels.toggleMaximizeWindow);
      },

      openNewWindow: (url: string) => {
        return ipcRenderer.invoke(MainWindowIPCChannels.openNewWindow, url);
      },

      keyboardShortcut: (enable: boolean) => {
        return ipcRenderer.send(MainWindowIPCChannels.keyboardShortcut, enable);
      }
    }
  }
}
