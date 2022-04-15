import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamRepo} from '../../Repository/StreamRepo';
import {Logger} from '../../Library/Infra/Logger';

type Props = {
}

type State = {
}

export class NotificationFragment extends React.Component<Props, State> {
  componentDidMount() {
    StreamEvent.onUpdateStreamIssues(this, (_streamId, updatedIssueIds) => this.handleUpdate(updatedIssueIds));
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
  }

  private async handleUpdate(updatedIssueIds: number[]) {
    if (!updatedIssueIds.length) return;
    if (!UserPrefRepo.getPref().general.notification) return;

    const {error: error1, issues} = await this.getNotifyIssues(updatedIssueIds);
    if (error1) return console.error(error1);
    if (!issues.length) return;

    const {error: error2, stream, issue, count} = await this.getNotifyStream(issues);
    if (error2) return console.error(error2);
    if (!stream || !issue) return;

    const {error: error3} = await this.notify(stream, issue, count);
    if (error3) return console.error(error3);
  }

  // 通知すべきissueを絞り込む
  private async getNotifyIssues(updatedIssueIds: number[]): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const {error, issues: updatedIssues} = await IssueRepo.getIssues(updatedIssueIds);
    if (error) return {error};

    const targetDate = new Date(Date.now() - 24 * 60 * 60 * 1000).getTime(); // 1day ago
    const targetIssues = updatedIssues
      .filter(issue => !IssueRepo.isRead(issue)) // 未読issue
      .filter(issue => !issue.unread_at) // 意図的に未読にしていないissue
      .filter(issue => !issue.archived_at) // 未archive issue
      .filter(issue => new Date(issue.updated_at).getTime() > targetDate); // 初回読み込み時に古すぎるのを通知しないように、直近のものだけを通知対象とする

    return {issues: targetIssues};
  }

  // 通知すべきstreamと必要な情報を取得する
  private async getNotifyStream(notifyIssues: IssueEntity[]): Promise<{error?: Error; stream?: StreamEntity; issue?: IssueEntity; count?: number}> {
    const {error, stream, issueIds} = await StreamRepo.getStreamMatchIssue(notifyIssues, true, true, true);
    if (error) return {error};
    if (!stream) return {};

    const issue = notifyIssues.find(issue => issueIds.includes(issue.id));
    return {stream, issue, count: issueIds.length};
  }

  private async notify(stream: StreamEntity, issue:IssueEntity, totalUpdatedIssueCount: number): Promise<{error?: Error}> {
    const title = `"${stream.name}" was updated (${totalUpdatedIssueCount})`;
    let body: string;
    if (totalUpdatedIssueCount === 1) {
      body = `"${issue.title}"`;
    } else {
      body = `"${issue.title}" and more`;
    }

    const silent = UserPrefRepo.getPref().general.notificationSilent;
    const notification = new Notification(title, {body, silent});
    notification.addEventListener('click', () => {
      StreamEvent.emitSelectStream(stream, issue);
    });

    Logger.verbose(NotificationFragment.name, `notify: ${issue.repo}#${issue.number}`, {
      stream: stream.name,
      updatedAt: issue.updated_at,
      readAt: issue.read_at,
    });

    return {};
  }

  render() {
    return null;
  }
}
