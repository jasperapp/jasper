import React from 'react';
import {IssueEvent} from '../../Event/IssueEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

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
    window.ipc.stream.setUnreadCount(count, UserPrefRepo.getPref().general.badge);
  }

  render() {
    return null;
  }
}
