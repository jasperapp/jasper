import fs from 'fs-extra';
import path from 'path';
import electron from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import escapeHTML from 'escape-html';
import IssueEmitter from '../IssueEmitter';
import IssueCenter from '../IssueCenter';
import WebViewEmitter from '../WebViewEmitter';
import Platform from '../../Util/Platform';
import StreamEmitter from '../StreamEmitter';
import SystemStreamEmitter from '../SystemStreamEmitter';
import AccountEmitter from '../AccountEmitter';

const jsdiff = require('diff');
const remote = electron.remote;
const Logger = remote.require('color-logger').default;
const Config = remote.require('./Config.js').default;
const GitHubClient = remote.require('./GitHub/GitHubClient.js').default;
const MenuItem = remote.MenuItem;
const clipboard = electron.clipboard;
const shell = electron.shell;
const GA = remote.require('./Util/GA').default;
const BrowserViewProxy = remote.require('./BrowserViewProxy').default;

// hack: support japanese tokenize
require('diff/lib/diff/word').wordDiff.tokenize = function(value){
  return value.split(/(\s+|\b|、|。|「|」)/u);
};

export default class WebViewComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      issue: null,
      readBody: null,
      currentUrl: null,
      classNameLoading: '',
      classNameBackButton: 'deactive',
      classNameForwardButton: 'deactive',
      classNameSearchBox: 'hidden',
      searchInPageCount: null
    };
    this._issueListeners = [];
    this._webViewListeners = [];
    this._streamListeners = [];
    this._systemStreamListeners = [];
    this._accountListeners = [];
    this._searchInPagePrevKeyword = null;
    this._webView = null;
    this._shiftKey = false;
    this._webContents = null;

    // injection javascript codes
    const dir = path.resolve(__dirname, '../Component/WebViewComponentInjection/');
    this._injectionCode = {
      style: fs.readFileSync(`${dir}/style.css`).toString(),
      theme: '',
      externalBrowser: fs.readFileSync(`${dir}/external-browser.js`).toString(),
      scrollToLast: fs.readFileSync(`${dir}/scroll-to-last.js`).toString(),
      showDiffBody: fs.readFileSync(`${dir}/show-diff-body.js`).toString(),
      updateBySelf: fs.readFileSync(`${dir}/update-by-self.js`).toString(),
      highlightComment: fs.readFileSync(`${dir}/highlight-comment.js`).toString(),
      alwaysOpenOutdated: fs.readFileSync(`${dir}/always-open-outdated.js`).toString(),
      contextMenu: fs.readFileSync(`${dir}/context-menu.js`).toString(),
      detectInput: fs.readFileSync(`${dir}/detect-input.js`).toString(),
    };
  }

  componentDidMount() {
    // const webView = ReactDOM.findDOMNode(this).querySelector('webview');
    const webView = BrowserViewProxy;
    this._webView = webView;

    {
      let id;
      id = IssueEmitter.addSelectIssueListener((issue, readBody)=>{
        this._loadIssue(issue, readBody);
      });
      this._issueListeners.push(id);

      id = IssueEmitter.addReadIssueListener((issue)=>{
        if (this.state.issue && issue.id === this.state.issue.id) this.setState({issue});
      });
      this._issueListeners.push(id);

      id = IssueEmitter.addMarkIssueListener((issue)=>{
        if (this.state.issue && issue.id === this.state.issue.id) this.setState({issue});
      });
      this._issueListeners.push(id);

      id = IssueEmitter.addArchiveIssueListener((issue)=>{
        if (this.state.issue && issue.id === this.state.issue.id) this.setState({issue});
      });
      this._issueListeners.push(id);
    }

    {
      let id;
      id = WebViewEmitter.addScrollListener(this._handleIssueScroll.bind(this));
      this._webViewListeners.push(id);
    }

    {
      let id;
      id = StreamEmitter.addOpenStreamSettingListener(()=> this._webView.hide(true));
      this._streamListeners.push(id);

      id = StreamEmitter.addCloseStreamSettingListener(()=> this._webView.hide(false));
      this._streamListeners.push(id);

      id = StreamEmitter.addOpenFilteredStreamSettingListener(()=> this._webView.hide(true));
      this._streamListeners.push(id);

      id = StreamEmitter.addCloseFilteredStreamSettingListener(()=> this._webView.hide(false));
      this._streamListeners.push(id);
    }

    {
      let id;
      id = SystemStreamEmitter.addOpenStreamSettingListener(()=> this._webView.hide(true));
      this._systemStreamListeners.push(id);

      id = SystemStreamEmitter.addCloseStreamSettingListener(()=> this._webView.hide(false));
      this._systemStreamListeners.push(id);
    }

    {
      let id;
      id = AccountEmitter.addOpenAccountSettingListener(()=> this._webView.hide(true));
      this._accountListeners.push(id);

      id = AccountEmitter.addCloseAccountSettingListener(()=> this._webView.hide(false));
      this._accountListeners.push(id);
    }

    {
      electron.ipcRenderer.on('command-webview', (ev, commandItem)=>{
        this._handleCommand(commandItem);
      });
    }

    this._setupDetectInput(webView);
    this._setupPageLoading(webView);
    this._setup404(webView);
    this._setupCSS(webView);
    this._setupContextMenu(webView);
    this._setupConsoleLog(webView);
    this._setupExternalBrowser(webView);
    this._setupUpdateBySelf(webView);
    this._setupHighlightComment(webView);
    this._setupAlwaysOpenOutdated(webView);
    this._setupScrollToLast(webView);
    this._setupShowDiffBody(webView);
    this._setupSearchInPage(webView);
    this._setupSearchBoxInputShiftKey();
  }

  _loadIssue(issue, readBody) {
    switch (Config.generalBrowser) {
      case Config.BROWSER_BUILTIN:
        this._webView.src = issue.value.html_url;
        break;
      case Config.BROWSER_EXTERNAL:
        this._webView.src = 'data://'; // blank page
        shell.openExternal(issue.html_url);
        this.setState({issue: issue});
        return;
        break;
      default:
        this.setState({issue: issue});
        return;
    }

    this.setState({
      issue: issue,
      readBody: readBody,
      currentUrl: issue.value.html_url,
      classNameLoading: this.state.currentUrl === issue.value.html_url ? '' : 'loading'
    });
  }

  _isTargetIssuePage() {
    const issueUrl = this.state.issue.html_url;
    const validUrls = [
      issueUrl,
      `${issueUrl}/files`
    ];
    return validUrls.includes(this._webView.getURL());
  }

  _isTargetHost() {
    const url = new URL(this._webView.getURL());
    return Config.webHost === url.host;
  }

  _setupWebContents(webContents) {
    webContents.session.on('will-download', (ev)=>{
      this.setState({classNameLoading: ''});
    });
  }

  _setupDetectInput(webView) {
    webView.addEventListener('dom-ready', ()=>{
      webView.executeJavaScript(this._injectionCode.detectInput, false);
    });

    webView.addEventListener('console-message', (evt, level, message)=>{
      if (message.indexOf('DETECT_INPUT:') === 0) {
        const res = message.split('DETECT_INPUT:')[1];

        if (res === 'true') {
          electron.ipcRenderer.send('keyboard-shortcut', false);
        } else {
          electron.ipcRenderer.send('keyboard-shortcut', true);
        }
      }
    });
  }

  _setupPageLoading(webView) {
    webView.addEventListener('did-start-loading', ()=>{
      // BrowserViewProxy.hide(true);
      this.setState({classNameLoading: 'loading'});

      // webView.webContents is not defined until first loading.
      if (!this._webContents) {
        this._webContents = webView.getWebContents();
        if (this._webContents) this._setupWebContents(this._webContents);
      }
    });

    // todo: consider using did-stop-loading
    webView.addEventListener('did-navigate', ()=>{
      // BrowserViewProxy.hide(false);
      this.setState({
        currentUrl: webView.getURL(),
        classNameLoading: '',
        classNameBackButton: webView.canGoBack() ? '' : 'deactive',
        classNameForwardButton: webView.canGoForward() ? '' : 'deactive'
      });
    });

    webView.addEventListener('did-navigate-in-page', ()=>{
      // BrowserViewProxy.hide(false);
      this.setState({
        currentUrl: webView.getURL(),
        classNameLoading: '',
        classNameBackButton: webView.canGoBack() ? '' : 'deactive',
        classNameForwardButton: webView.canGoForward() ? '' : 'deactive'
      });
    });
  }

  _setup404(webview) {
    webview.addEventListener('did-get-response-details', (evt) =>{
      const statusCode = evt.httpResponseCode;
      const url = evt.newURL;
      if (statusCode === 404 && url === this.state.currentUrl) {
        const signInUrl = `https://${Config.webHost}/login?return_to=${encodeURIComponent(url)}`;
        webview.src = signInUrl;
        this.setState({
          currentUrl: signInUrl,
          classNameLoading: 'loading'
        });
      }
    });
  }

  _setupConsoleLog(webView) {
    webView.addEventListener('console-message', (evt, level, message)=>{
      const log = `[webview] ${message}`;
      switch (level) {
        case -1: Logger.v(log); break;
        case 0: Logger.d(log); break;
        case 1: Logger.w(log); break;
        case 2: Logger.e(log); break;
      }
    });
  }

  _setupExternalBrowser(webView) {
    webView.addEventListener('dom-ready', ()=>{
      const always = Config.generalAlwaysOpenExternalUrlInExternalBrowser;
      const code = this._injectionCode.externalBrowser.replace('_alwaysOpenExternalUrlInExternalBrowser_', `${always}`);
      webView.executeJavaScript(code, false);
    });

    webView.addEventListener('console-message', (evt, level, message)=>{
      if (message.indexOf('OPEN_EXTERNAL_BROWSER:') === 0) {
        const url = message.split('OPEN_EXTERNAL_BROWSER:')[1];
        const shell = require('electron').shell;
        shell.openExternal(url);
      }
    });
  }

  _setupContextMenu(webView) {
    webView.addEventListener('dom-ready', ()=>{
      webView.executeJavaScript(this._injectionCode.contextMenu, false);
    });

    webView.addEventListener('console-message', (evt, level, message)=>{
      if (message.indexOf('CONTEXT_MENU:') !== 0) return;

      const data = JSON.parse(message.split('CONTEXT_MENU:')[1]);

      const menu = new remote.Menu();
      if (data.url) {
        menu.append(new MenuItem({
          label: 'Open browser',
          click: ()=>{
            shell.openExternal(data.url);
          }
        }));

        menu.append(new MenuItem({
          label: 'Copy link',
          click: ()=>{
            clipboard.writeText(data.url);
          }
        }));

        menu.append(new MenuItem({ type: 'separator' }));
      }

      if (data.text) {

        if (Platform.isMac()) {
          menu.append(new MenuItem({
            label: 'Search text in dictionary',
            click: ()=> {
              // webView.showDefinitionForSelection();
              shell.openExternal(`dict://${data.text}`);
            }
          }));

          menu.append(new MenuItem({ type: 'separator' }));
        }

        menu.append(new MenuItem({
          label: 'Copy text',
          click: ()=>{
            //clipboard.writeText(data.text);
            webView.copy();
          }
        }));

        menu.append(new MenuItem({
          label: 'Cut text',
          click: ()=>{
            webView.cut();
          }
        }));

      }

      menu.append(new MenuItem({
        label: 'Paste text',
        click: ()=>{
          webView.paste();
        }
      }));

      menu.popup(remote.getCurrentWindow());
    });
  }

  _setupScrollToLast(webView) {
    webView.addEventListener('dom-ready', ()=>{
      if (!this._isTargetIssuePage()) return;

      // if issue body was updated, does not scroll to last comment.
      let updatedBody = false;
      if (this.state.issue && this.state.readBody) {
        if (this.state.readBody !== this.state.issue.body) updatedBody = true;
      }

      let prevReadAt;
      if (this.state.issue) prevReadAt = new Date(this.state.issue.prev_read_at).getTime();
      if (!prevReadAt) return;

      const code = this._injectionCode.scrollToLast.replace('_prevReadAt_', prevReadAt).replace('_updatedBody_', `${updatedBody}`);
      webView.executeJavaScript(code, false);
    });
  }

  _setupShowDiffBody(webView) {
    webView.addEventListener('dom-ready', ()=>{
      if (!this._isTargetIssuePage()) return;

      let diffBodyHTMLWord = '';
      let diffBodyHTMLChar = '';
      if (this.state.issue && this.state.readBody) {
        if (this.state.readBody === this.state.issue.body) return;

        // word diff
        {
          const diffBody = jsdiff.diffWords(this.state.readBody, this.state.issue.body);
          diffBody.forEach(function(part){
            const type = part.added ? 'add' :
              part.removed ? 'delete' : 'normal';
            const value = escapeHTML(part.value.replace(/`/g, '\\`'));
            diffBodyHTMLWord += `<span class="diff-body-${type}">${value}</span>`;
          });
        }

        // char diff
        {
          const diffBody = jsdiff.diffChars(this.state.readBody, this.state.issue.body);
          diffBody.forEach(function(part){
            const type = part.added ? 'add' :
              part.removed ? 'delete' : 'normal';
            const value = escapeHTML(part.value.replace(/`/g, '\\`'));
            diffBodyHTMLChar += `<span class="diff-body-${type}">${value}</span>`;
          });
        }
      }

      if (!diffBodyHTMLWord.length) return;

      const code = this._injectionCode.showDiffBody
        .replace('_diffBodyHTML_Word_', diffBodyHTMLWord)
        .replace('_diffBodyHTML_Char_', diffBodyHTMLChar);
      webView.executeJavaScript(code, false);
    });

    webView.addEventListener('console-message', (evt, level, message)=> {
      if (message.indexOf('OPEN_DIFF_BODY:') !== 0) return;
      GA.eventBrowserOpenDiffBody();
    });
  }

  _setupUpdateBySelf(webView) {
    webView.addEventListener('dom-ready', ()=>{
      if (!this._isTargetIssuePage()) return;
      const code = this._injectionCode.updateBySelf.replace('_loginName_', Config.loginName);
      webView.executeJavaScript(code, false);
    });

    webView.addEventListener('did-navigate-in-page', ()=>{
      if (!this._isTargetIssuePage()) return;
      const code = this._injectionCode.updateBySelf.replace('_loginName_', Config.loginName);
      webView.executeJavaScript(code, false);
    });

    let isRequesting = false;
    webView.addEventListener('console-message', (evt, level, message)=>{
      if (!this._isTargetIssuePage()) return;
      if (['UPDATE_BY_SELF:', 'UPDATE_COMMENT_BY_SELF:'].includes(message) === false) return;

      if (isRequesting) return;
      isRequesting = true;

      async function update(issue){
        let date;

        const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
        const repo = issue.repo;
        const number = issue.number;
        const type = issue.type === 'issue' ? 'issues' : 'pulls';

        try {
          const res = await client.requestImmediate(`/repos/${repo}/${type}/${number}`);
          const updatedIssue = res.body;
          date = new Date(updatedIssue.updated_at);
          await IssueCenter.update(issue.id, date);
          await IssueCenter.read(issue.id, date);
        } catch (e) {
          Logger.e(e);
        }

        isRequesting = false;
      }

      update(this.state.issue);
    });
  }

  _setupHighlightComment(webView) {
    webView.addEventListener('dom-ready', ()=>{
      if (!this._isTargetIssuePage()) return;

      let prevReadAt;
      if (this.state.issue) prevReadAt = new Date(this.state.issue.prev_read_at).getTime();

      const code = this._injectionCode.highlightComment.replace('_prevReadAt_', prevReadAt);
      webView.executeJavaScript(code, false);
    });
  }

  _setupAlwaysOpenOutdated(webView) {
    webView.addEventListener('dom-ready', ()=>{
      if (!this._isTargetIssuePage()) return;
      if (!Config.generalAlwaysOpenOutdated) return;

      const code = this._injectionCode.alwaysOpenOutdated;
      webView.executeJavaScript(code, false);
    });
  }

  _setupSearchBoxInputShiftKey() {
    // hack: electron can not handling shiftKey
    ReactDOM.findDOMNode(this).querySelector('#searchBoxInput').addEventListener('keyup', this._handleSearchBox.bind(this));
  }

  _setupCSS(webView) {
    electron.ipcRenderer.on('load-theme-browser', (event, css)=> {
      this._injectionCode.theme = css;
      if (this._injectionCode.theme) webView.insertCSS(this._injectionCode.theme);
    });

    webView.addEventListener('dom-ready', ()=>{
      if (!this._isTargetIssuePage()) return;
      webView.insertCSS(this._injectionCode.style);
      if (this._injectionCode.theme) webView.insertCSS(this._injectionCode.theme);
    });
  }

  _setupSearchInPage(webView) {
    const isMac = Platform.isMac();
    webView.addEventListener('before-input-event', (evt, input)=>{
      if (input.type !== 'keyDown') return;

      let flag = false;
      if (isMac) {
        flag = input.meta && input.key === 'f'; // cmd + f
      } else {
        flag = input.control && input.key === 'f'; // ctrl + f
      }

      if (flag) {
        this.setState({classNameSearchBox: ''});
        this._webView.blur();
        const input = ReactDOM.findDOMNode(this).querySelector('.search-box input');
        input.focus();
        input.selectionStart = 0;
      }
    });

    const state = {};
    webView.addEventListener('found-in-page', (evt, result) => {
      if (result.activeMatchOrdinal !== undefined) {
        state.active = result.activeMatchOrdinal;
      }

      if (result.finalUpdate) {
        if (result.matches === 0) state.active = 0;
        this.setState({searchInPageCount: `${state.active} / ${result.matches}`});
      }
    });

    webView.addEventListener('did-navigate', ()=>{
      webView.stopFindInPage('keepSelection');
      this.setState({classNameSearchBox: 'hidden', searchInPageCount: ''});
    });
  }

  componentWillUnmount() {
    IssueEmitter.removeListeners(this._issueListeners);
    WebViewEmitter.removeListeners(this._webViewListeners);
    StreamEmitter.removeListeners(this._streamListeners);
    SystemStreamEmitter.removeListeners(this._systemStreamListeners);
    AccountEmitter.removeListeners(this._accountListeners);
  }

  render() {
    const issue = this.state.issue;
    const readIcon = IssueCenter.isRead(issue) ? 'icon icon-book-open' : 'icon icon-book';
    const markIcon = issue && issue.marked_at ? 'icon icon-star' : 'icon icon-star-empty';
    const archiveIcon = issue && issue.archived_at ? 'icon icon-archive' : 'icon icon-inbox';
    const currentUrl = this.state.currentUrl === 'data://' ? '' : this.state.currentUrl;

    const selectBrowserClassName = ()=> {
      if (this.state.issue && !Config.generalBrowser) {
        return 'select-browser';
      } else {
        return 'hidden';
      }
    };

    const externalBrowserClassName = ()=> {
      if (Config.generalBrowser === 'external') {
        return 'external-browser';
      } else {
        return 'hidden';
      }
    };

    // judge to hide WebView(BrowserView)
    if (this._webView) {
      if (!Config.generalBrowser) {
        this._webView.hide(true);
      } else if (Config.generalBrowser === 'external') {
        this._webView.hide(true);
      } else {
        this._webView.hide(false);
      }
    }

    return <div className="webview">
      <div className="toolbar toolbar-header">
        <div className="toolbar-actions">

          <div className="btn-group">
            <button title="Back"
                    className={`btn btn-default move-history ${this.state.classNameBackButton}`}
                    onClick={this._handleMoveHistory.bind(this, -1)}>
              <span className="icon icon-left"/>
            </button>
            <button title="Forward"
                    className={`btn btn-default move-history ${this.state.classNameForwardButton}`}
                    onClick={this._handleMoveHistory.bind(this, 1)}>
              <span className="icon icon-right"/>
            </button>
          </div>

          <div className="btn-group url-box">
            <input
              className={`form-control ${this.state.classNameLoading}`}
              value={currentUrl || ''}
              onChange={this._handleChangeURL.bind(this, 'change')}
              onKeyDown={this._handleChangeURL.bind(this, 'keydown')}
            />
          </div>

          <div className="btn-group">
            <button className="btn btn-default" title="Toggle Read" onClick={this._handleIssueAction.bind(this, 'read')}>
              <span className={readIcon}/>
            </button>
            <button className="btn btn-default" title="Toggle Star" onClick={this._handleIssueAction.bind(this, 'mark')} >
              <span className={markIcon}/>
            </button>
            <button className="btn btn-default" title="Toggle Archive" onClick={this._handleIssueAction.bind(this, 'archive')} >
              <span className={archiveIcon}/>
            </button>
            <button className="btn btn-default" title="Open Browser" onClick={this._handleIssueAction.bind(this, 'export')}>
              <span className="icon icon-export"/>
            </button>
          </div>

          <div className={`search-box ${this.state.classNameSearchBox}`}>
            <input id="searchBoxInput" className="form-control"/>
            <span className="count">{this.state.searchInPageCount}</span>
            <span className="icon icon-up-open" onClick={this._handleSearchBoxNav.bind(this, 'back')}/>
            <span className="icon icon-down-open" onClick={this._handleSearchBoxNav.bind(this, 'next')}/>
            <span className="icon icon-cancel" onClick={this._handleSearchBoxNav.bind(this, 'close')}/>
          </div>

        </div>
      </div>

      <iframe className={`spin ${this.state.classNameLoading}`} src="./spin_medium.html"></iframe>

      <div className={selectBrowserClassName()}>
        <div>
          <div>Please select the browser to use when you read the issue.</div>
          <div>You can change this selection in preferences.</div>
          <button className="btn btn-large btn-positive" onClick={this._handleSelectBrowser.bind(this, 'builtin')}>
            Use built-in browser
          </button>
          <span>OR</span>
          <button className="btn btn-large btn-default" onClick={this._handleSelectBrowser.bind(this, 'external')}>
            Use external browser
          </button>
        </div>
      </div>

      <div className={externalBrowserClassName()}>
        <img src="../image/icon-gray.png"/>
        <div className={Config.generalBrowser === 'external' ? '' : 'hidden'}>
          <p>You can also change the setting of the browser.</p>
        </div>
      </div>
    </div>;
  }

  _handleChangeURL(command, evt) {
    switch (command) {
      case 'change':
        this.setState({currentUrl: evt.target.value});
        break;
      case 'keydown':
        if (evt.keyCode === 13) { // enter
          const url = evt.target.value;
          this._webView.src = url;
          this.setState({
            currentUrl: url,
            classNameLoading: 'loading'
          });
        }
        break;
    }
  }

  async _handleIssueAction(command) {
    let issue = this.state.issue;
    if (!issue) return;

    switch (command) {
      case 'read':
        if (IssueCenter.isRead(issue)) {
          issue = await IssueCenter.read(issue.id, null);
        } else {
          issue = await IssueCenter.read(issue.id, new Date());
        }
        break;
      case 'mark':
        if (issue.marked_at) {
          issue = await IssueCenter.mark(issue.id, null);
        } else {
          issue = await IssueCenter.mark(issue.id, new Date());
        }
        break;
      case 'archive':
        if (issue.archived_at) {
          issue = await IssueCenter.archive(issue.id, null);
        } else {
          issue = await IssueCenter.archive(issue.id, new Date());
        }
        break;
      case 'export':
        const shell = require('electron').shell;
        shell.openExternal(this._webView.getURL());
        break;
    }

    this.setState({issue});
  }

  _handleIssueScroll(direction) {
    if(!this._webView) return;

    if (direction > 0) {
      this._webView.executeJavaScript('window.scrollBy(0, 40)');
    } else {
      this._webView.executeJavaScript('window.scrollBy(0, -40)');
    }
  }

  _handleSearchBoxNav(command) {
    switch (command) {
      case 'back':
        this._webView.findInPage(this._searchInPagePrevKeyword, {forward: false});
        break;
      case 'next':
        this._webView.findInPage(this._searchInPagePrevKeyword, {findNext: true});
        break;
      case 'close':
        this._searchInPagePrevKeyword = '';
        this._webView.stopFindInPage('keepSelection');
        this._webView.focus();
        this.setState({classNameSearchBox: 'hidden', searchInPageCount: ''});
        break;
    }
  }

  _handleSearchBox(evt) {
    const keyword = evt.target.value;

    if (evt.keyCode === 27) { // escape
      this._searchInPagePrevKeyword = '';
      this._webView.stopFindInPage('keepSelection');
      this._webView.focus();
      this.setState({classNameSearchBox: 'hidden', searchInPageCount: ''});
      return;
    }

    if (!keyword) {
      this._searchInPagePrevKeyword = '';
      this._webView.stopFindInPage('clearSelection');
      this.setState({searchInPageCount: ''});
      return;
    }

    if (evt.keyCode === 13) { // enter
      this._searchInPagePrevKeyword = keyword;
      if (evt.shiftKey) {
        this._webView.findInPage(keyword, {forward: false});
      } else {
        this._webView.findInPage(keyword, {findNext: true});
      }
      return;
    }

    if (keyword !== this._searchInPagePrevKeyword) {
      this._searchInPagePrevKeyword = keyword;
      this._webView.findInPage(keyword);
    }
  }

  _handleMoveHistory(direction, e) {
    const webView = BrowserViewProxy;
    if (direction > 0 && webView.canGoForward()) {
      webView.goForward();
    } else if(direction < 0 && webView.canGoBack()) {
      webView.goBack();
    } else {
      return;
    }

    this.setState({
      currentUrl: webView.getURL(),
      classNameLoading: 'loading'
    });
  }

  _handleSelectBrowser(browser) {
    Config.generalBrowser = browser;

    const issue = this.state.issue;
    if (!issue) return;

    switch (browser) {
      case 'builtin':
        const signInUrl = `https://${Config.webHost}/login?return_to=${encodeURIComponent(issue.html_url)}`;
        this._webView.src = signInUrl;
        this.setState({
          currentUrl: signInUrl,
          classNameLoading: 'loading'
        });
        break;
      case 'external':
        this._loadIssue(issue);
        break;
    }
  }

  _handleCommand(commandItem) {
    const command = commandItem.command;
    switch (command) {
      case 'reload':
        if(this._webView) this._webView.reload();
        break;
      case 'back':
        this._handleMoveHistory(-1);
        break;
      case 'forward':
        this._handleMoveHistory(1);
        break;
      case 'scroll_down':
        this._handleIssueScroll(1);
        break;
      case 'scroll_up':
        this._handleIssueScroll(-1);
        break;
      case 'read':
        this._handleIssueAction('read');
        break;
      case 'mark':
        this._handleIssueAction('mark');
        break;
      case 'archive':
        this._handleIssueAction('archive');
        break;
      case 'export':
        this._handleIssueAction('export');
        break;
      case 'open_location':{
        const el = ReactDOM.findDOMNode(this).querySelector('.toolbar.toolbar-header .url-box input');
        el.focus();
        el.select();
        break;
      }
    }
  }
}
