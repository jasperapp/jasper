import {shell} from 'electron';

class _ShellUtil {
  openExternal(url: string) {
    try {
      const urlObj = new URL(url);
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        shell.openExternal(url);
      } else {
        console.error(`url is not valid. url = ${url}`);
      }
    } catch(e) {
      console.error(e);
      console.error(`url is not valid. url = ${url}`);
    }
  }
}

export const ShellUtil = new _ShellUtil();
