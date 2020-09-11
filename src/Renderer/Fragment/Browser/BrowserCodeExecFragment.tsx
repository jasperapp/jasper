import React from 'react';
import path from "path";
import fs from "fs";
import escapeHTML from 'escape-html';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {AppIPC} from '../../../IPC/AppIPC';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {shell} from 'electron';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEvent} from '../../Event/IssueEvent';
import {GitHubIssueClient} from '../../Library/GitHub/GitHubIssueClient';
import {GitHubUtil} from '../../Library/Util/GitHubUtil';
import {GetIssueStateEntity} from '../../Library/Type/GetIssueStateEntity';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamEvent} from '../../Event/StreamEvent';

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
  private readonly jsDetectInput: string;
  private readonly jsGetIssueState: string;
  private readonly jsProjectBoard: string;

  private projectStream: StreamEntity | null;

  constructor(props) {
    super(props);

    const dir = path.resolve(__dirname, './BrowserFragmentAsset/');
    this.css = fs.readFileSync(`${dir}/style.css`).toString();
    this.jsExternalBrowser = fs.readFileSync(`${dir}/external-browser.js`).toString();
    this.jsShowDiffBody = fs.readFileSync(`${dir}/show-diff-body.js`).toString();
    this.jsUpdateBySelf = fs.readFileSync(`${dir}/update-by-self.js`).toString();
    this.jsHighlightAndScroll = fs.readFileSync(`${dir}/highlight-and-scroll.js`).toString();
    this.jsDetectInput = fs.readFileSync(`${dir}/detect-input.js`).toString();
    this.jsGetIssueState = fs.readFileSync(`${dir}/get-issue-state.js`).toString();
    this.jsProjectBoard = fs.readFileSync(`${dir}/project-board.js`).toString();
  }

  componentDidMount() {
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
    BrowserViewIPC.onEventDOMReady(() => {
      if (!this.isTargetHost()) return;
      BrowserViewIPC.insertCSS(this.css);
    });
  }

  // todo: v0.10.0でmerged_atに対応したときに、過去分へのadhocな対応として実装したものなので、いずれ削除する
  private setupGetIssueState() {
    BrowserViewIPC.onEventDOMReady(() => BrowserViewIPC.executeJavaScript(this.jsGetIssueState));

    BrowserViewIPC.onEventConsoleMessage((_level, message)=>{
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

  private async setupProjectBoard() {
    StreamEvent.onSelectStream(this, (stream) => {
      if (stream.type === 'ProjectStream') this.projectStream = stream;
    });

    BrowserViewIPC.onEventDOMReady(() => this.handleProjectBoardInit());
    BrowserViewIPC.onEventConsoleMessage((_level, message) => this.handleProjectBoardConsoleMessage(message));
  }

  private async handleProjectBoardInit() {
    if (this.projectStream?.type !== 'ProjectStream') return;
    if (!GitHubUtil.isProjectUrl(UserPrefRepo.getPref().github.webHost, this.projectStream.queries[0])) return;

    const stream = this.projectStream;
    const {error, issues} = await IssueRepo.getIssuesInStream(stream.queryStreamId, stream.defaultFilter, stream.userFilter, 0, 1000);
    if (error) return console.error(error);

    const transferIssues = issues.map(issue => {
      return {id: issue.id, repo: issue.repo, number: issue.number, isRead: IssueRepo.isRead(issue)};
    });
    const js = this.jsProjectBoard.replace(`__ISSUES__`, JSON.stringify(transferIssues))

    await BrowserViewIPC.executeJavaScript(js);
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
    }
  }

  private isTargetIssuePage() {
    // if (!this.state.issue) return false;
    //
    // const issueUrl = this.state.issue.html_url;
    // const validUrls = [issueUrl, `${issueUrl}/files`];
    // return validUrls.includes(BrowserViewIPC.getURL());
    return GitHubUtil.isTargetIssuePage(BrowserViewIPC.getURL(), this.state.issue);
  }

  private isTargetHost() {
    const url = new URL(BrowserViewIPC.getURL());
    return UserPrefRepo.getPref().github.webHost === url.host;
  }

  render() {
    return null;
  }
}
