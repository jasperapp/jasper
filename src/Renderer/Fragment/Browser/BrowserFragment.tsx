import electron from 'electron';
import React from 'react';
import {IssueEvent} from '../../Event/IssueEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {WebViewEvent} from '../../Event/WebViewEvent';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {IssueEntity} from '../../Type/IssueEntity';
import {BrowserAddressBarFragment} from './BrowserAddressBarFragment';
import {BrowserSearchBarFragment} from './BrowserSearchBarFragment';
import {BrowserCodeExecFragment} from './BrowserCodeExecFragment';

interface State {
  issue: any;
  currentUrl: string;
  toolbarMode: 'url' | 'search',
}

export class BrowserFragment extends React.Component<any, State> {
  state: State = {
    issue: null,
    currentUrl: '',
    toolbarMode: 'url',
  };

  private browserAddressBarFragment: BrowserAddressBarFragment;

  componentDidMount() {
    {
      electron.ipcRenderer.on('command-webview', (_ev, commandItem)=>{
        this.handleCommand(commandItem);
      });
    }

    this.setupConsoleLog();
  }

  componentWillUnmount() {
    IssueEvent.offAll(this);
    WebViewEvent.offAll(this);
    SystemStreamEvent.offAll(this);
  }

  private setupConsoleLog() {
    BrowserViewIPC.onEventConsoleMessage((level, message) => {
      const log = `[webview] ${message}`;
      switch (level) {
        case -1: console.debug(log); break;
        case 0: console.log(log); break;
        case 1: console.warn(log); break;
        case 2: console.error(log); break;
      }
    });
  }


  private handleSelectBrowser(browser) {
    ConfigRepo.setGeneralBrowser(browser);

    const issue = this.state.issue;
    if (!issue) return;

    switch (browser) {
      case 'builtin':
        const signInUrl = `https://${ConfigRepo.getConfig().github.webHost}/login?return_to=${encodeURIComponent(issue.html_url)}`;
        BrowserViewIPC.loadURL(signInUrl);
        this.setState({
          currentUrl: signInUrl,
        });
        break;
      case 'external':
        // this.loadIssue(issue);
        break;
    }
  }

  private handleCommand(commandItem) {
    const command = commandItem.command;
    switch (command) {
      case 'reload':
        BrowserViewIPC.reload();
        break;
      case 'back':
        // this.handleGoBack();
        break;
      case 'forward':
        // this.handleGoForward();
        break;
      case 'scroll_down':
        // this.handleIssueScroll(1);
        break;
      case 'scroll_up':
        // this.handleIssueScroll(-1);
        break;
      case 'read':
        this.handleToggleIssueRead(this.state.issue);
        break;
      case 'mark':
        this.handleToggleMark(this.state.issue);
        break;
      case 'archive':
        this.handleToggleArchive(this.state.issue);
        break;
      case 'open_location':
        this.browserAddressBarFragment.focus();
        break;
    }
  }

  private async handleToggleIssueRead(targetIssue: IssueEntity) {
    if (!targetIssue) return;

    const date = IssueRepo.isRead(targetIssue) ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, date);
    if (error) return console.error(error);

    this.setState({issue: updatedIssue});
    IssueEvent.emitReadIssue(updatedIssue);
  }

  private async handleToggleArchive(targetIssue: IssueEntity | null) {
    if (!targetIssue) return;

    const date = targetIssue.archived_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateArchive(targetIssue.id, date);
    if (error) return console.error(error);

    this.setState({issue: updatedIssue});
    IssueEvent.emitArchiveIssue(updatedIssue);
  }

  private async handleToggleMark(targetIssue: IssueEntity | null) {
    if (!targetIssue) return;

    const date = targetIssue.marked_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateMark(targetIssue.id, date);
    if (error) return console.error(error);

    this.setState({issue: updatedIssue});
    IssueEvent.emitMarkIssue(updatedIssue);
  }

  private handleSearchStart() {
    this.setState({toolbarMode: 'search'});
  }

  render() {
    const selectBrowserClassName = ()=> {
      if (this.state.issue && !ConfigRepo.getConfig().general.browser) {
        return 'select-browser';
      } else {
        return 'hidden';
      }
    };

    const externalBrowserClassName = ()=> {
      if (ConfigRepo.getConfig().general.browser === 'external') {
        return 'external-browser';
      } else {
        return 'hidden';
      }
    };

    // judge to hide WebView(BrowserView)
    if (!ConfigRepo.getConfig().general.browser) {
      BrowserViewIPC.hide(true);
    } else if (ConfigRepo.getConfig().general.browser === 'external') {
      BrowserViewIPC.hide(true);
    } else {
      BrowserViewIPC.hide(false);
    }

    return <div className="webview">
      {this.renderToolbar()}
      {this.renderSearchBar()}
      <BrowserCodeExecFragment/>
      <div className={selectBrowserClassName()}>
        <div>
          <div>Please select the browser to use when you read the issue.</div>
          <div>You can change this selection in preferences.</div>
          <button className="btn btn-large btn-positive" onClick={this.handleSelectBrowser.bind(this, 'builtin')}>
            Use built-in browser
          </button>
          <span>OR</span>
          <button className="btn btn-large btn-default" onClick={this.handleSelectBrowser.bind(this, 'external')}>
            Use external browser
          </button>
        </div>
      </div>

      <div className={externalBrowserClassName()}>
        <img src="../image/icon-gray.png"/>
        <div className={ConfigRepo.getConfig().general.browser === 'external' ? '' : 'hidden'}>
          <p>You can also change the setting of the browser.</p>
        </div>
      </div>
    </div>;
  }

  private renderToolbar() {
    return (
      <BrowserAddressBarFragment
        show={this.state.toolbarMode === 'url'}
        ref={ref => this.browserAddressBarFragment = ref}
        onSearchStart={() => this.handleSearchStart()}
      />
    );
  }

  renderSearchBar() {
    return (
      <BrowserSearchBarFragment
        show={this.state.toolbarMode === 'search'}
        onClose={() => this.setState({toolbarMode: 'url'})}
      />
    );
  }
}
