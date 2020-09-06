import React from 'react';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamEvent} from '../../Event/StreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import path from "path";
import fs from "fs";
import {GitHubUtil} from '../../Library/Util/GitHubUtil';
import {ProjectBoardWindowIPC} from '../../../IPC/ProjectBoardWindowIPC';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';

type Props = {
}

type State = {
}

export class ProjectBoardFragment extends React.Component<Props, State> {
  private readonly jsProjectBoard: string;
  private projectStream: StreamEntity;
  private skipNextSelectStream: boolean;

  constructor(props) {
    super(props);

    const dir = path.resolve(__dirname, './asset/');
    this.jsProjectBoard = fs.readFileSync(`${dir}/project-board.js`).toString();
  }

  componentDidMount() {
    StreamEvent.onSelectStream(this, (stream) => this.handleSelectStream(stream));

    ProjectBoardWindowIPC.onEventConsoleMessage((_level, message) => this.handleConsoleMessage(message));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
  }

  private async handleSelectStream(stream: StreamEntity) {
    if (this.skipNextSelectStream) return;

    if (stream.type !== 'ProjectStream') {
      this.projectStream = null;
      await ProjectBoardWindowIPC.close();
      return;
    }

    this.projectStream = stream;
    const {error, issues} = await IssueRepo.getIssuesInStream(stream.queryStreamId, stream.defaultFilter, stream.userFilter, 0, 1000);
    if (error) return console.error(error);

    const transferIssues = issues.map(issue => {
      return {id: issue.id, repo: issue.repo, number: issue.number, isRead: IssueRepo.isRead(issue)};
    });
    const js = this.jsProjectBoard.replace(`__ISSUES__`, JSON.stringify(transferIssues))

    const url = stream.queries[0];
    await ProjectBoardWindowIPC.open(url, stream.name, js);
  }

  private async handleConsoleMessage(message: string) {
    if (message.indexOf('PROJECT_BOARD_ACTION:') !== 0) return;

    const json = message.split('PROJECT_BOARD_ACTION:')[1];
    const obj = JSON.parse(json) as {action: string; url: string};
    if (obj.action === 'select') {
      const {repo, issueNumber} = GitHubUtil.getInfo(obj.url);
      const {error, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
      if (error) return console.error(error);

      // todo: selectStreamイベントが送信されて、自身のhandleも発火してしまう。それを防ぐためにフラグをたてている
      // これ、苦肉の策なので削除したい。
      // emitするときにsenderとして自身を渡して、sender == ownerなhandlerは起動しないようにする
      this.skipNextSelectStream = true;
      await StreamEvent.emitSelectStream(this.projectStream, issue);
      this.skipNextSelectStream = false;

      await BrowserViewIPC.focus();
    }
  }

  render() {
    return null;
  }
}
