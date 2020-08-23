import React from 'react';
import {StreamEvent} from '../../Event/StreamEvent';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEvent} from '../../Event/IssueEvent';

type Props = {
}

type State = {
}

export class BadgeFragment extends React.Component<Props, State> {
  componentDidMount() {
    this.handleUnreadCount();
    StreamEvent.onUpdateStreamIssues(this, () => this.handleUnreadCount());
    IssueEvent.onUpdateIssues(this, () => this.handleUnreadCount());
    IssueEvent.onReadAllIssues(this, () => this.handleUnreadCount());
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async handleUnreadCount() {
    const {error, count} = await IssueRepo.getTotalUnreadCount();
    if (error) return console.error(error);
    StreamIPC.setUnreadCount(count, UserPrefRepo.getPref().general.badge);
  }

  render() {
    return null;
  }
}
