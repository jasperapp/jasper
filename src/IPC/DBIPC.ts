import {ipcMain, ipcRenderer} from 'electron';

enum ChannelNames {
  subscribeIssue = 'subscribeIssue',
}

type SubscribeIssueParams = {
  issue: any;
}

type SubscribeIssueReturn = {
  error?: Error;
}

class _DBIPC {
  async subscribeIssue(issue: any): Promise<SubscribeIssueParams> {
    const params: SubscribeIssueParams = {issue};
    return ipcRenderer.invoke(ChannelNames.subscribeIssue, params);
  }

  onSubscribeIssue(handler: (_ev, params: SubscribeIssueParams) => Promise<SubscribeIssueReturn>) {
    ipcMain.handle(ChannelNames.subscribeIssue, handler);
  }
}

export const DBIPC = new _DBIPC();
