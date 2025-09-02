import escapeHTML from 'escape-html';
import React from 'react';
import {BrowserViewIPCChannels} from '../../../IPC/BrowserViewIPC/BrowserViewIPC.channel';
import {IssueEvent} from '../../Event/IssueEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {GitHubIssueClient} from '../../Library/GitHub/GitHubIssueClient';
import {GetIssueStateEntity} from '../../Library/Type/GetIssueStateEntity';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {GitHubUtil} from '../../Library/Util/GitHubUtil';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {IssueRepo} from '../../Repository/IssueRepo';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

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

  private css: string;
  private jsExternalBrowser: string;
  private jsShowDiffBody: string;
  private jsUpdateBySelf: string;
  private jsHighlightAndScroll: string;
  private jsDetectInput: string;
  private jsGetIssueState: string;
  private jsProjectBoard: string;
  private jsProjectNextBoard: string;

  private projectStream: StreamEntity | null;

  async componentDidMount() {
    const dir = './Renderer/asset/BrowserFragmentAsset/';
    this.css = await window.ipc.node.fs.readFile(`${dir}/style.css`);
    this.jsExternalBrowser = await window.ipc.node.fs.readFile(`${dir}/external-browser.js`);
    this.jsShowDiffBody = await window.ipc.node.fs.readFile(`${dir}/show-diff-body.js`);
    this.jsUpdateBySelf = await window.ipc.node.fs.readFile(`${dir}/update-by-self.js`);
    this.jsHighlightAndScroll = await window.ipc.node.fs.readFile(`${dir}/highlight-and-scroll.js`);
    this.jsDetectInput = await window.ipc.node.fs.readFile(`${dir}/detect-input.js`);
    this.jsGetIssueState = await window.ipc.node.fs.readFile(`${dir}/get-issue-state.js`);
    this.jsProjectBoard = await window.ipc.node.fs.readFile(`${dir}/project-board.js`);
    this.jsProjectNextBoard = await window.ipc.node.fs.readFile(`${dir}/project-next-board.js`);

    this.setupDetectInput();
    this.setupCSS();
    this.setupExternalBrowser();
    this.setupUpdateBySelf();
    this.setupHighlightAndScrollLast();
    this.setupShowDiffBody();
    this.setupGetIssueState();
    this.setupProjectBoard();

    IssueEvent.onSelectIssue(this, (issue, readBody) => this.setState({issue, readBody}));
  }

  componentWillUnmount() {
    IssueEvent.offAll(this);
  }

  private setupDetectInput() {
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => window.ipc.browserView.executeJavaScript(this.jsDetectInput));
    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, _level, message) => {
      if (message.indexOf('DETECT_INPUT:') === 0) {
        const res = message.split('DETECT_INPUT:')[1];

        if (res === 'true') {
          window.ipc.mainWindow.keyboardShortcut(false);
        } else {
          window.ipc.mainWindow.keyboardShortcut(true);
        }
      }
    });
  }

  private setupExternalBrowser() {
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => {
      const always = UserPrefRepo.getPref().general.alwaysOpenExternalUrlInExternalBrowser;
      const code = this.jsExternalBrowser.replace('_alwaysOpenExternalUrlInExternalBrowser_', `${always}`);
      window.ipc.browserView.executeJavaScript(code);
    });

    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, _level, message) => {
      if (message.indexOf('OPEN_EXTERNAL_BROWSER:') === 0) {
        const url = message.split('OPEN_EXTERNAL_BROWSER:')[1];
        ShellUtil.openExternal(url);
      }
    });
  }

  private setupHighlightAndScrollLast() {
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, async () => {
      if (!this.isTargetIssuePage()) return;

      // 最新のissueの状態を取りなおす。
      // 理由: IssueWindowでissueを開いたときはMainWindow側でissue.readAtを更新している。
      // そうすると、タイミングによってはIssueWindow内のissue.readAtはまだ古いままなことがある。
      // そのため、最新の状態を取り直すようにしている。
      const {issue, error} = await IssueRepo.getIssue(this.state.issue.id);
      if (error) return console.error(error);

      const prevReadAt = new Date(issue.prev_read_at).getTime().toString();

      const code = this.jsHighlightAndScroll.replace('_prevReadAt_', prevReadAt);
      window.ipc.browserView.executeJavaScript(code);
    });
  }

  private setupShowDiffBody() {
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => {
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
      window.ipc.browserView.executeJavaScript(code);
    });

    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, _level, message) => {
      if (message.indexOf('OPEN_DIFF_BODY:') !== 0) return;
    });
  }

  private setupUpdateBySelf() {
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => {
      if (!this.isTargetIssuePage()) return;
      const code = this.jsUpdateBySelf.replace('_loginName_', UserPrefRepo.getUser().login);
      window.ipc.browserView.executeJavaScript(code);
    });

    // 過剰にJSが読み込まれてしまうので無効にしておく
    // window.ipc.on(BrowserViewIPCChannels.eventDidNavigateInPage, () => {
    //   if (!this.isTargetIssuePage()) return;
    //   const code = this.jsUpdateBySelf.replace('_loginName_', UserPrefRepo.getUser().login);
    //   window.ipc.browserView.executeJavaScript(code);
    // });

    let isRequesting = false;
    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, _level, message) => {
      if (!this.isTargetIssuePage()) return;
      if (['UPDATE_BY_SELF:', 'UPDATE_COMMENT_BY_SELF:'].includes(message) === false) return;

      if (isRequesting) return;
      isRequesting = true;

      async function update(issue){
        const github = UserPrefRepo.getPref().github;
        const client = new GitHubIssueClient(github.accessToken, github.host, github.pathPrefix, github.https);
        const repo = issue.repo;
        const number = issue.number;

        try {
          const res = await client.getIssue(repo, number);
          if (res.error) return console.error(res.error);
          const updatedIssue = res.issue;
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
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => {
      if (!this.isTargetHost()) return;
      window.ipc.browserView.insertCSS(this.css);
    });
  }

  // todo: v0.10.0でmerged_atに対応したときに、過去分へのadhocな対応として実装したものなので、いずれ削除する
  private setupGetIssueState() {
    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => window.ipc.browserView.executeJavaScript(this.jsGetIssueState));

    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, _level, message) => {
      if (message.indexOf('GET_ISSUE_STATE:') === 0) {
        const res = message.split('GET_ISSUE_STATE:')[1];
        const obj = JSON.parse(res) as GetIssueStateEntity;
        this.handlePRMerged(obj);
      }
    });
  }

  // 読み込んだPRはマージ状態だが、merged_atが保存されていない場合、closed_atで更新する
  private async handlePRMerged(issueState: GetIssueStateEntity) {
    if (issueState.issueType === 'pr' && issueState.issueState === 'merged' && issueState.issueNumber) {
      const {error, issue} = await IssueRepo.getIssueByIssueNumber(issueState.repo, issueState.issueNumber);
      if (error) return console.error(error);

      if (!issue.merged_at && issue.closed_at) {
        const {error, issue: updatedIssue} = await IssueRepo.updateMerged(issue.id, issue.closed_at);
        if (error) return console.error(error);
        IssueEvent.emitUpdateIssues([updatedIssue], [issue], 'merged');
      }
    }
  }

  private setupProjectBoard() {
    StreamEvent.onSelectStream(this, (stream) => {
      if (stream.type === 'ProjectStream') this.projectStream = stream;
    });

    window.ipc.on(BrowserViewIPCChannels.eventDOMReady, () => this.handleProjectBoardInit());
    window.ipc.on(BrowserViewIPCChannels.eventConsoleMessage, (_ev, _level, message) => this.handleProjectBoardConsoleMessage(message));
  }

  private async handleProjectBoardInit() {
    if (this.projectStream?.type !== 'ProjectStream') return;
    if (!GitHubUtil.isProjectUrl(UserPrefRepo.getPref().github.webHost, this.projectStream.queries[0])) return;

    const stream = this.projectStream;
    const {error, issues} = await IssueRepo.getIssuesInStream(stream.queryStreamId, stream.defaultFilter, stream.userFilters, 0, 1000);
    if (error) return console.error(error);

    const transferIssues = issues.map(issue => {
      return {id: issue.id, repo: issue.repo, number: issue.number, isRead: IssueRepo.isRead(issue)};
    });

    // for old project
    {
      const js = this.jsProjectBoard
        .replace(`__ISSUES__`, JSON.stringify(transferIssues))
        .replace(`__IS_DARK_MODE__`, `${UserPrefRepo.getThemeName() === 'dark'}`);

      await window.ipc.browserView.executeJavaScript(js);
    }

    // for beta project
    {
      const js = this.jsProjectNextBoard
        .replace(`__ISSUES__`, JSON.stringify(transferIssues))
        .replace(`__IS_DARK_MODE__`, `${UserPrefRepo.getThemeName() === 'dark'}`);

      await window.ipc.browserView.executeJavaScript(js);
    }
  }

  private async handleProjectBoardConsoleMessage(message: string) {
    if (message.indexOf('PROJECT_BOARD_ACTION:') !== 0) return;

    const json = message.split('PROJECT_BOARD_ACTION:')[1];
    const obj = JSON.parse(json) as {action: string; url: string};
    if (obj.action === 'select') {
      const {repo, issueNumber} = GitHubUtil.getInfo(obj.url);
      const {error, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
      if (error) return console.error(error);

      await StreamEvent.emitSelectStream(this.projectStream, issue);
    } else if (obj.action === 'read') {
      const {repo, issueNumber} = GitHubUtil.getInfo(obj.url);
      const {error, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
      if (error) return console.error(error);
      const res = await IssueRepo.updateRead(issue.id, new Date());
      if (res.error) return console.error(res.error);
      IssueEvent.emitUpdateIssues([res.issue], [issue], 'read');
    }
  }

  private isTargetIssuePage() {
    // if (!this.state.issue) return false;
    //
    // const issueUrl = this.state.issue.html_url;
    // const validUrls = [issueUrl, `${issueUrl}/files`];
    // return validUrls.includes(BrowserViewIPC.getURL());
    return GitHubUtil.isTargetIssuePage(window.ipc.browserView.getURL(), this.state.issue);
  }

  private isTargetHost() {
    const url = new URL(window.ipc.browserView.getURL());
    return UserPrefRepo.getPref().github.webHost === url.host;
  }

  render() {
    return null;
  }
}
