import {ipcMain, ipcRenderer} from 'electron';

enum ChannelNames {
  importIssues = 'importIssues',
}

type ImportIssuesParams = {
  issues: any[];
}

type ImportIssuesReturn = {
  error?: Error;
}

class _DBIPC {
  async importIssues(issues: any[]): Promise<ImportIssuesParams> {
    return ipcRenderer.invoke(ChannelNames.importIssues, {issues});
  }

  onImportIssues(handler: (_ev, params: ImportIssuesParams) => Promise<ImportIssuesReturn>) {
    ipcMain.handle(ChannelNames.importIssues, handler);
  }
}

export const DBIPC = new _DBIPC();
