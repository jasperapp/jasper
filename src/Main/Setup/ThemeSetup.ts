import {Config} from '../Config';
import {AppWindow} from '../AppWindow';
import {FSUtil} from '../Util/FSUtil';

class _ThemeSetup {
  async exec() {
    if (Config.themeMainPath)  {
      const css = FSUtil.read(Config.themeMainPath);
      AppWindow.getWindow().webContents.send('load-theme-main', css);
    } else {
      AppWindow.getWindow().webContents.send('load-theme-main', '');
    }
  }
}

export const ThemeSetup = new _ThemeSetup();
