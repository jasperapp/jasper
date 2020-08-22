import React from 'react';
import {remote} from 'electron';
import path from "path";
import fs from "fs";
import escapeHTML from 'escape-html';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {AppIPC} from '../../../IPC/AppIPC';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {clipboard, shell} from 'electron';
import {UserAgentUtil} from '../../Util/UserAgentUtil';
import {IssueEntity} from '../../Type/IssueEntity';
import {GARepo} from '../../Repository/GARepo';
import {GitHubClient} from '../../Repository/GitHub/GitHubClient';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEvent} from '../../Event/IssueEvent';
import {BrowserViewEvent} from '../../Event/BrowserViewEvent';
const {Menu, MenuItem} = remote;

const jsdiff = require('diff');

// hack: support japanese tokenize
require('diff/lib/diff/word').wordDiff.tokenize = function(value){
  return value.split(/(\s+|\b|、|。|「|」)/u);
};

type Props = {
}

type State = {
  issue: IssueEntity | null;
  readBody: string;
}

export class BrowserCodeExecFragment extends React.Component<Props, State> {
  state: State = {
    issue: null,
    readBody: '',
  }

  private readonly css: string;
  private readonly jsExternalBrowser: string;
  private readonly jsShowDiffBody: string;
  private readonly jsUpdateBySelf: string;
  private readonly jsHighlightAndScroll: string;
  private readonly jsContextMenu: string;
  private readonly jsDetectInput: string;

  constructor(props) {
    super(props);

    const dir = path.resolve(__dirname, './BrowserFragmentAsset/');
    this.css = fs.readFileSync(`${dir}/style.css`).toString();
    this.jsExternalBrowser = fs.readFileSync(`${dir}/external-browser.js`).toString();
    this.jsShowDiffBody = fs.readFileSync(`${dir}/show-diff-body.js`).toString();
    this.jsUpdateBySelf = fs.readFileSync(`${dir}/update-by-self.js`).toString();
    this.jsHighlightAndScroll = fs.readFileSync(`${dir}/highlight-and-scroll.js`).toString();
    this.jsContextMenu = fs.readFileSync(`${dir}/context-menu.js`).toString();
    this.jsDetectInput = fs.readFileSync(`${dir}/detect-input.js`).toString();
  }

  componentDidMount() {
    this.setupDetectInput();
    this.setupCSS();
    this.setupContextMenu()
    this.setupExternalBrowser();
    this.setupUpdateBySelf();
    this.setupHighlightAndScrollLast();
    this.setupShowDiffBody();

    BrowserViewEvent.onScroll(this, (direction) => this.handlePageScroll(direction));

    IssueEvent.onSelectIssue(this, (issue, readBody) => this.setState({issue, readBody}));
  }

  componentWillUnmount() {
    IssueEvent.offAll(this);
  }

  private setupDetectInput() {
    BrowserViewIPC.onEventDOMReady(() => BrowserViewIPC.executeJavaScript(this.jsDetectInput));

    BrowserViewIPC.onEventConsoleMessage((_level, message)=>{
      if (message.indexOf('DETECT_INPUT:') === 0) {
        const res = message.split('DETECT_INPUT:')[1];

        if (res === 'true') {
          AppIPC.keyboardShortcut(false);
        } else {
          AppIPC.keyboardShortcut(true);
        }
      }
    });
  }

  private setupExternalBrowser() {
    BrowserViewIPC.onEventDOMReady(() => {
      const always = UserPrefRepo.getPref().general.alwaysOpenExternalUrlInExternalBrowser;
      const code = this.jsExternalBrowser.replace('_alwaysOpenExternalUrlInExternalBrowser_', `${always}`);
      BrowserViewIPC.executeJavaScript(code);
    });

    BrowserViewIPC.onEventConsoleMessage((_level, message)=>{
      if (message.indexOf('OPEN_EXTERNAL_BROWSER:') === 0) {
        const url = message.split('OPEN_EXTERNAL_BROWSER:')[1];
        shell.openExternal(url);
      }
    });
  }

  private setupContextMenu() {
    BrowserViewIPC.onEventDOMReady(() => BrowserViewIPC.executeJavaScript(this.jsContextMenu));

    BrowserViewIPC.onEventConsoleMessage((_level, message)=>{
      if (message.indexOf('CONTEXT_MENU:') !== 0) return;

      const data = JSON.parse(message.split('CONTEXT_MENU:')[1]);

      const menu = new Menu();
      if (data.url) {
        menu.append(new MenuItem({label: 'Open browser', click: () => shell.openExternal(data.url)}));
        menu.append(new MenuItem({label: 'Copy link', click: () => clipboard.writeText(data.url)}));
        menu.append(new MenuItem({type: 'separator'}));
      }

      if (data.text) {
        if (UserAgentUtil.isMac()) {
          menu.append(new MenuItem({label: 'Search text in dictionary', click: () => shell.openExternal(`dict://${data.text}`)}));
          menu.append(new MenuItem({type: 'separator'}));
        }

        menu.append(new MenuItem({label: 'Copy text', click: () => clipboard.writeText(data.text)}));
        menu.append(new MenuItem({label: 'Cut text', click: () => BrowserViewIPC.cut()}));
      }

      menu.append(new MenuItem({label: 'Paste text', click: ()=> BrowserViewIPC.paste()}));
      menu.popup({window: remote.getCurrentWindow()});
    });
  }

  private setupHighlightAndScrollLast() {
    BrowserViewIPC.onEventDOMReady(() => {
      if (!this.isTargetIssuePage()) return;

      // if issue body was updated, does not scroll to last comment.
      let updatedBody = false;
      if (this.state.issue && this.state.readBody) {
        if (this.state.readBody !== this.state.issue.body) updatedBody = true;
      }

      let prevReadAt;
      if (this.state.issue) prevReadAt = new Date(this.state.issue.prev_read_at).getTime();

      const code = this.jsHighlightAndScroll.replace('_prevReadAt_', prevReadAt).replace('_updatedBody_', `${updatedBody}`);
      BrowserViewIPC.executeJavaScript(code);
    });
  }

  private setupShowDiffBody() {
    BrowserViewIPC.onEventDOMReady(() => {
      if (!this.isTargetIssuePage()) return;

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

      const code = this.jsShowDiffBody
        .replace('_diffBodyHTML_Word_', diffBodyHTMLWord)
        .replace('_diffBodyHTML_Char_', diffBodyHTMLChar);
      BrowserViewIPC.executeJavaScript(code);
    });

    BrowserViewIPC.onEventConsoleMessage((_level, message)=> {
      if (message.indexOf('OPEN_DIFF_BODY:') !== 0) return;
      GARepo.eventBrowserOpenDiffBody();
    });
  }

  private setupUpdateBySelf() {
    BrowserViewIPC.onEventDOMReady(() => {
      if (!this.isTargetIssuePage()) return;
      const code = this.jsUpdateBySelf.replace('_loginName_', UserPrefRepo.getUser().login);
      BrowserViewIPC.executeJavaScript(code);
    });

    BrowserViewIPC.onEventDidNavigateInPage(() => {
      if (!this.isTargetIssuePage()) return;
      const code = this.jsUpdateBySelf.replace('_loginName_', UserPrefRepo.getUser().login);
      BrowserViewIPC.executeJavaScript(code);
    });

    let isRequesting = false;
    BrowserViewIPC.onEventConsoleMessage((_level, message)=>{
      if (!this.isTargetIssuePage()) return;
      if (['UPDATE_BY_SELF:', 'UPDATE_COMMENT_BY_SELF:'].includes(message) === false) return;

      if (isRequesting) return;
      isRequesting = true;

      async function update(issue){
        const github = UserPrefRepo.getPref().github;
        const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
        const repo = issue.repo;
        const number = issue.number;
        const type = issue.type === 'issue' ? 'issues' : 'pulls';

        try {
          const res = await client.request(`/repos/${repo}/${type}/${number}`);
          const updatedIssue = res.body;
          const date = new Date(updatedIssue.updated_at);
          await IssueRepo.updateRead(issue.id, date);
          const res2 = await IssueRepo.updateRead(issue.id, date);
          if (res2.error) return console.error(res2.error);
        } catch (e) {
          console.error(e);
        }

        isRequesting = false;
      }

      update(this.state.issue);
    });
  }

  private setupCSS() {
    BrowserViewIPC.onEventDOMReady(() => {
      if (!this.isTargetHost()) return;
      BrowserViewIPC.insertCSS(this.css);
    });
  }

  private handlePageScroll(direction: -1 | 1) {
    if (direction > 0) {
      BrowserViewIPC.scrollDown();
    } else {
      BrowserViewIPC.scrollUp();
    }
  }

  private isTargetIssuePage() {
    if (!this.state.issue) return false;

    const issueUrl = this.state.issue.html_url;
    const validUrls = [issueUrl, `${issueUrl}/files`];
    return validUrls.includes(BrowserViewIPC.getURL());
  }

  private isTargetHost() {
    const url = new URL(BrowserViewIPC.getURL());
    return UserPrefRepo.getPref().github.webHost === url.host;
  }

  render() {
    return null;
  }
}
