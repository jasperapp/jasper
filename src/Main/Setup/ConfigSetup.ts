import nodePath from 'path'
import {AppPath} from '../AppPath';
import {ConfigType} from '../../Type/ConfigType';
import {FSUtil} from '../Util/FSUtil';
import {ConfigIPC} from '../../IPC/ConfigIPC';

class _ConfigSetup {
  async exec() {
    const configDir = AppPath.getConfigDir();
    const configPath = AppPath.getConfigPath();

    ConfigIPC.onReadConfig(async () => {
      if (!FSUtil.exist(configPath)) return {};

      const configs = FSUtil.readJSON<ConfigType[]>(configPath);
      return {configs, index: 0};
    });

    ConfigIPC.onWriteConfig(async (_ev, configs) => {
      if (!FSUtil.exist(configPath)) FSUtil.mkdir(configDir);

      FSUtil.writeJSON<ConfigType[]>(configPath, configs);
    });

    ConfigIPC.onDeleteConfig(async (_ev, index) => {
      const configs = FSUtil.readJSON<ConfigType[]>(configPath);
      const config = configs[index];
      const dbPath = nodePath.resolve(nodePath.dirname(configPath), config.database.path);
      FSUtil.rm(dbPath);
      configs.splice(index, 1);
      FSUtil.writeJSON<ConfigType[]>(configPath, configs);
    });
  }
}

export const ConfigSetup = new _ConfigSetup();
