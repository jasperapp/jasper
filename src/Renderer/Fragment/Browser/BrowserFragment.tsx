import React from 'react';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {BrowserLocationFragment} from './BrowserLocationFragment';
import {BrowserSearchFragment} from './BrowserSearchFragment';
import {BrowserCodeExecFragment} from './BrowserCodeExecFragment';

interface State {
  issue: any;
  currentUrl: string;
  toolbarMode: 'location' | 'search',
}

export class BrowserFragment extends React.Component<any, State> {
  state: State = {
    issue: null,
    currentUrl: '',
    toolbarMode: 'location',
  };

  componentDidMount() {
    BrowserViewIPC.onStartSearch(() => this.handleSearchStart());
    this.setupConsoleLog();
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

    return (
      <div className="webview">
        <BrowserLocationFragment
          show={this.state.toolbarMode === 'location'}
          onSearchStart={() => this.handleSearchStart()}
        />

        <BrowserSearchFragment
          show={this.state.toolbarMode === 'search'}
          onClose={() => this.setState({toolbarMode: 'location'})}
        />

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
      </div>
    );
  }
}
