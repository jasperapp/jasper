import React from 'react';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {StreamEvent} from '../Event/StreamEvent';
import {ConfigRepo} from '../Repository/ConfigRepo';
import {IssueRepo} from '../Repository/IssueRepo';
import {StreamRepo} from '../Repository/StreamRepo';
import {SystemStreamRepo} from '../Repository/SystemStreamRepo';
import {IssueEntity} from '../Type/IssueEntity';
import {IssueEvent} from '../Event/IssueEvent';
import {BaseStreamEntity, FilteredStreamEntity} from '../Type/StreamEntity';
import {FilteredStreamRepo} from '../Repository/FilteredStreamRepo';

type Props = {
}

type State = {
}

export class NotificationFragment extends React.Component<Props, State> {
  componentDidMount() {
    SystemStreamEvent.onUpdateStream(this, (_streamId, updatedIssueIds) => this.handleUpdate(updatedIssueIds));
    StreamEvent.onUpdateStream(this, (_streamId, updatedIssueIds) => this.handleUpdate(updatedIssueIds));
  }

  componentWillUnmount() {
    SystemStreamEvent.offAll(this);
    StreamEvent.offAll(this);
  }

  private async handleUpdate(updatedIssueIds: number[]) {
    if (!updatedIssueIds.length) return;
    if (!ConfigRepo.getConfig().general.notification) return;

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
  private async getNotifyStream(notifyIssues: IssueEntity[]): Promise<{error?: Error; stream?: BaseStreamEntity; issue?: IssueEntity; count?: number}> {
    const {error: error1, streams} = await StreamRepo.getAllStreams();
    if (error1) return {error: error1};

    const {error: error2, filteredStreams} = await FilteredStreamRepo.getAllFilteredStreams();
    if (error2) return {error: error2};

    const {error: error3, systemStreams} = await SystemStreamRepo.getAllSystemStreams();
    if (error3) return {error: error3};

    // notifyIssuesを含むstreamを見つける
    const notifyIssueIds = notifyIssues.map(issue => issue.id);
    const allStreams: BaseStreamEntity[] = [...streams, ...filteredStreams, ...systemStreams];
    for (const stream of allStreams) {
      if (!stream.enabled) continue;
      if (!stream.notification) continue;

      let streamId = stream.id;
      const filters = [stream.defaultFilter];

      if (stream.type === 'filteredStream') {
        streamId = (stream as FilteredStreamEntity).stream_id;
        filters.push((stream as FilteredStreamEntity).filter);
      }

      const {error, issueIds} = await IssueRepo.getIncludeIds(notifyIssueIds, streamId, filters.join(' '));
      if (error) return {error};

      if (issueIds.length) {
        const issue = notifyIssues.find(issue => issueIds.includes(issue.id));
        return {stream, issue, count: issueIds.length};
      }
    }

    return {};
  }

  private async notify(stream: BaseStreamEntity, issue:IssueEntity, totalUpdatedIssueCount: number): Promise<{error?: Error}> {
    const title = `"${stream.name}" was updated (${totalUpdatedIssueCount})`;
    let body: string;
    if (totalUpdatedIssueCount === 1) {
      body = `"${issue.title}"`;
    } else {
      body = `"${issue.title}" and more`;
    }

    let filteredStream: FilteredStreamEntity;
    if (stream.type === 'filteredStream') {
      filteredStream = stream as FilteredStreamEntity;
      const {error, stream: parentStream} = await StreamRepo.getStream(filteredStream.stream_id);
      if (error) return {error};
      stream = parentStream;
    }

    const silent = ConfigRepo.getConfig().general.notificationSilent;
    const notification = new Notification(title, {body, silent});
    notification.addEventListener('click', () => {
      if (stream.type === 'systemStream') {
        SystemStreamEvent.emitSelectStream(stream, issue);
      } else {
        StreamEvent.emitSelectStream(stream, filteredStream, issue);
      }

      IssueEvent.emitSelectIssue(issue, issue.read_body);
    });

    return {};
  }

  render() {
    return null;
  }
}
