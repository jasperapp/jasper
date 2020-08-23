import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {IssueEvent} from '../../Event/IssueEvent';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamRepo} from '../../Repository/StreamRepo';

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
      .filter(issue => !issue.archived_at) // 未archive issue
      .filter(issue => new Date(issue.updated_at).getTime() > targetDate); // 初回読み込み時に古すぎるのを通知しないように、直近のものだけを通知対象とする

    return {issues: targetIssues};
  }

  // 通知すべきstreamと必要な情報を取得する
  private async getNotifyStream(notifyIssues: IssueEntity[]): Promise<{error?: Error; stream?: StreamEntity; issue?: IssueEntity; count?: number}> {
    const {error: error1, streams: customStreams} = await StreamRepo.getAllStreams(['userStream']);
    if (error1) return {error: error1};

    const {error: error2, streams: childStreams} = await StreamRepo.getAllStreams(['filterStream']);
    if (error2) return {error: error2};

    const {error: error3, streams: systemStreams} = await StreamRepo.getAllStreams(['systemStream']);
    if (error3) return {error: error3};

    // notifyIssuesを含むstreamを見つける
    const notifyIssueIds = notifyIssues.map(issue => issue.id);
    const allStreams: StreamEntity[] = [...childStreams, ...customStreams, ...systemStreams];
    for (const stream of allStreams) {
      if (!stream.enabled) continue;
      if (!stream.notification) continue;

      const {error, issueIds} = await IssueRepo.getIncludeIds(notifyIssueIds, stream.queryStreamId, stream.defaultFilter, stream.userFilter);
      if (error) return {error};

      if (issueIds.length) {
        const issue = notifyIssues.find(issue => issueIds.includes(issue.id));
        return {stream, issue, count: issueIds.length};
      }
    }

    return {};
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
      IssueEvent.emitSelectIssue(issue, issue.read_body);
    });

    return {};
  }

  render() {
    return null;
  }
}
