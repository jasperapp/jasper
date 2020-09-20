import {BrowserWindow} from 'electron';
import {IssueIPC} from '../../IPC/IssueIPC';

class _IssueBind {
  async bindIPC(window: BrowserWindow) {
    IssueIPC.initWindow(window);
  }
}

export const IssueBind = new _IssueBind();
