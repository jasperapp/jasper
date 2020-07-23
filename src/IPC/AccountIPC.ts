import {ipcMain, ipcRenderer} from 'electron';

type SwitchAccountParamsType = {
  index: number;
}

type SwitchAccountReturnType = {
  error?: Error;
}

enum ChannelNames {
  switchAccount = 'switchAccount',
}

class _AccountIPC {
  async switchAccount(index: number): Promise<SwitchAccountReturnType> {
    return ipcRenderer.invoke(ChannelNames.switchAccount, {index});
  }

  onSwitchAccount(handler: (ev, params: SwitchAccountParamsType) => Promise<SwitchAccountReturnType>) {
    ipcMain.handle(ChannelNames.switchAccount, handler);
  }
}

export const AccountIPC = new _AccountIPC();
