import {ConnectionCheckIPC} from '../IPC/ConnectionCheckIPC';
import {GitHubWindowUtil} from './Util/GitHubWindowUtil';

class _IPCSetup {
  setup() {
    ConnectionCheckIPC.onExec(async (_ev, webHost, https) => {
      const p = new Promise(resolve => {
        const githubWindow = GitHubWindowUtil.create(webHost, https);
        githubWindow.on('close', () => resolve());
      });

      await p;
    });
  }
}

export const IPCSetup = new _IPCSetup();
