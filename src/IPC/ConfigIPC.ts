import {ConfigType} from '../Type/ConfigType';
import {ipcMain, ipcRenderer} from 'electron';

enum Channels {
  readConfigs = 'ConfigIPC:readConfigs',
  writeConfigs = 'ConfigIPC:writeConfigs',
  deleteConfig = 'ConfigIPC:deleteConfig'
}

class _ConfigIPC {
  // read configs
  async readConfigs(): Promise<{configs: ConfigType[]; index: number}> {
    return ipcRenderer.invoke(Channels.readConfigs);
  }

  async onReadConfig(handler: () => Promise<{configs: ConfigType[]; index: number}>) {
    return ipcMain.handle(Channels.readConfigs, handler);
  }

  // write configs
  async writeConfigs(configs: ConfigType[]): Promise<void> {
    return ipcRenderer.invoke(Channels.writeConfigs, configs);
  }

  async onWriteConfig(handler: (_ev, configs: ConfigType[]) => Promise<void>) {
    return ipcMain.handle(Channels.writeConfigs, handler);
  }

  // delete config
  async deleteConfig(index: number): Promise<void> {
    return ipcRenderer.invoke(Channels.deleteConfig, index);
  }

  async onDeleteConfig(handler: (_ev, index: number) => Promise<void>) {
    return ipcMain.handle(Channels.deleteConfig, handler);
  }
}

export const ConfigIPC = new _ConfigIPC();
