import {GitHubV4Client} from './GitHubV4Client';
import {
  RemoteGitHubV4IssueEntity,
  RemoteGitHubV4IssueNodesEntity, RemoteGitHubV4TimelineItemEntity
} from '../../Type/RemoteGitHubV4/RemoteGitHubV4IssueNodesEntity';

export class GitHubV4IssueClient extends GitHubV4Client {
  async getIssuesByNodeIds(nodeIds: string[]): Promise<{error?: Error; issues?: RemoteGitHubV4IssueEntity[]}> {
    const joinedNodeIds = nodeIds.map(nodeId => `"${nodeId}"`).join(',');
    const query = QUERY_TEMPLATE.replace(`__NODE_IDS__`, joinedNodeIds);
    const {error, data} = await this.request<RemoteGitHubV4IssueNodesEntity>(query);
    if (error) return {error};

    const issues = data.nodes;

    // inject last timeline
    for (const issue of issues) {
      const {timelineUser, timelineAt} = this.getLastTimelineInfo(issue);
      issue.lastTimelineUser = timelineUser;
      issue.lastTimelineAt = timelineAt;
    }

    return {issues};
  }

  private getLastTimelineInfo(issue: RemoteGitHubV4IssueEntity): {timelineUser: string, timelineAt: string} {
    // timelineがない == descしかない == 新規issue
    if (!issue.timelineItems?.nodes?.length) {
      return {timelineUser: issue.author.login, timelineAt: issue.updatedAt};
    }

    const timelineItems = [...issue.timelineItems.nodes];
    timelineItems.sort((timeline1, timeline2) => {
      const {timelineAt: timelineAt1} = this.getTimelineInfo(timeline1);
      const {timelineAt: timelineAt2} = this.getTimelineInfo(timeline2);
      return new Date(timelineAt2).getTime() - new Date(timelineAt1).getTime();
    });

    const item = timelineItems[0];
    return this.getTimelineInfo(item);
  }

  private getTimelineInfo(timelineItem: RemoteGitHubV4TimelineItemEntity): {timelineUser: string; timelineAt: string} {
    const timelineUser = timelineItem.actor?.login
      || timelineItem.editor?.login
      || timelineItem.author?.login
      || timelineItem.commit?.author?.user?.login
      || timelineItem.comments?.nodes?.[0]?.editor?.login
      || timelineItem.comments?.nodes?.[0]?.author?.login
      || timelineItem.lastSeenCommit?.author?.user?.login
      || '';

    const timelineAt = timelineItem.updatedAt
      || timelineItem.createdAt
      || timelineItem.commit?.pushedDate
      || timelineItem.comments?.nodes?.[0]?.updatedAt
      || timelineItem.comments?.nodes?.[0]?.createdAt
      || timelineItem.lastSeenCommit?.pushedDate
      || '';

    return {timelineUser, timelineAt};
  }
}

const COMMON_QUERY_TEMPLATE = `
  __typename
  updatedAt
  author {
    login
  }
  number
  repository {
    nameWithOwner
    isPrivate
  }      
  participants(first: 100) {
    nodes {
      login
      avatarUrl
      name
    }
  }
`;

const ISSUE_TIMELINE_ITEMS = `
# https://docs.github.com/en/graphql/reference/unions#issuetimelineitems
... on AddedToProjectEvent {__typename createdAt actor {login}}
... on AssignedEvent {__typename createdAt actor {login}}
... on ClosedEvent {__typename createdAt actor {login}}
... on CommentDeletedEvent {__typename createdAt actor {login}}
... on ConnectedEvent {__typename createdAt actor {login}}
... on ConvertedNoteToIssueEvent {__typename createdAt actor {login}}
... on CrossReferencedEvent {__typename createdAt actor {login}}
... on DemilestonedEvent {__typename createdAt actor {login}}
... on DisconnectedEvent {__typename createdAt actor {login}}
# not actor
... on IssueComment {__typename createdAt updatedAt author {login} editor {login}}
... on LabeledEvent {__typename createdAt actor {login}}
... on LockedEvent {__typename createdAt actor {login}}
... on MarkedAsDuplicateEvent {__typename createdAt actor {login}}
... on MentionedEvent {__typename createdAt actor {login}}
... on MilestonedEvent {__typename createdAt actor {login}}
... on MovedColumnsInProjectEvent {__typename createdAt actor {login}}
... on PinnedEvent {__typename createdAt actor {login}}
... on ReferencedEvent {__typename createdAt actor {login}}
... on RemovedFromProjectEvent {__typename createdAt actor {login}}
... on RenamedTitleEvent {__typename createdAt actor {login}}
... on ReopenedEvent {__typename createdAt actor {login}}
... on SubscribedEvent {__typename createdAt actor {login}}
... on TransferredEvent {__typename createdAt actor {login}}
... on UnassignedEvent {__typename createdAt actor {login}}
... on UnlabeledEvent {__typename createdAt actor {login}}
... on UnlockedEvent {__typename createdAt actor {login}}
... on UnmarkedAsDuplicateEvent {__typename createdAt actor {login}}
... on UnpinnedEvent {__typename createdAt actor {login}}
... on UnsubscribedEvent {__typename createdAt actor {login}}
... on UserBlockedEvent {__typename createdAt actor {login}}
`;

const PULL_REQUEST_TIMELINE_ITEMS = `
# https://docs.github.com/en/graphql/reference/unions#pullrequesttimelineitems
... on AddedToProjectEvent {__typename actor {login}}
... on AssignedEvent {__typename actor {login}}
... on AutomaticBaseChangeFailedEvent {__typename actor {login}}
... on AutomaticBaseChangeSucceededEvent {__typename actor {login}}
... on BaseRefChangedEvent {__typename actor {login}}
... on BaseRefForcePushedEvent {__typename actor {login}}
... on ClosedEvent {__typename actor {login}}
... on CommentDeletedEvent {__typename actor {login}}
... on ConnectedEvent {__typename actor {login}}
... on ConvertToDraftEvent {__typename actor {login}}
... on ConvertedNoteToIssueEvent {__typename actor {login}}
... on CrossReferencedEvent {__typename actor {login}}
... on DemilestonedEvent {__typename actor {login}}
... on DeployedEvent {__typename actor {login}}
... on DeploymentEnvironmentChangedEvent {__typename actor {login}}
... on DisconnectedEvent {__typename actor {login}}
... on HeadRefDeletedEvent {__typename actor {login}}
... on HeadRefForcePushedEvent {__typename actor {login}}
... on HeadRefRestoredEvent {__typename actor {login}}
# not actor
... on IssueComment {__typename author {login} editor{login}}
... on LabeledEvent {__typename actor {login}}
... on LockedEvent {__typename actor {login}}
... on MarkedAsDuplicateEvent {__typename actor {login}}
... on MentionedEvent {__typename actor {login}}
... on MergedEvent {__typename actor {login}}
... on MilestonedEvent {__typename actor {login}}
... on MovedColumnsInProjectEvent {__typename actor {login}}
... on PinnedEvent {__typename actor {login}}
# not actor
... on PullRequestCommit {__typename commit {author {user {login}}}}
# not actor
... on PullRequestCommitCommentThread {__typename comments(last: 1) {nodes {editor {login}}}}
# not actor
... on PullRequestReview {__typename author {login} editor {login}}
# not actor
... on PullRequestReviewThread {__typename comments(last: 1) {nodes {author {login} editor {login}}}}
# not actor
... on PullRequestRevisionMarker {__typename  lastSeenCommit {author {user {login}}}}
... on ReadyForReviewEvent {__typename actor {login}}
... on ReferencedEvent {__typename actor {login}}
... on RemovedFromProjectEvent {__typename actor {login}}
... on RenamedTitleEvent {__typename actor {login}}
... on ReopenedEvent {__typename actor {login}}
... on ReviewDismissedEvent {__typename actor {login}}
... on ReviewRequestRemovedEvent {__typename actor {login}}
... on ReviewRequestedEvent {__typename actor {login}}
... on SubscribedEvent {__typename actor {login}}
... on TransferredEvent {__typename actor {login}}
... on UnassignedEvent {__typename actor {login}}
... on UnlabeledEvent {__typename actor {login}}
... on UnlockedEvent {__typename actor {login}}
... on UnmarkedAsDuplicateEvent {__typename actor {login}}
... on UnpinnedEvent {__typename actor {login}}
... on UnsubscribedEvent {__typename actor {login}}
... on UserBlockedEvent {__typename actor {login}}
`;

const QUERY_TEMPLATE = `
nodes(ids: [__NODE_IDS__]) {
  ... on Issue {
    ${COMMON_QUERY_TEMPLATE}
    timelineItems(last: 100) {
      nodes {
        __typename
        ${ISSUE_TIMELINE_ITEMS}
      }
    }
  }
  
  ... on PullRequest {
    ${COMMON_QUERY_TEMPLATE}
    isDraft
    mergedAt
    reviewRequests(first:100) {
      nodes {
        requestedReviewer {
          ... on  User {
            login
            avatarUrl
            name
          }
        }
      }
    }
    timelineItems(last: 100) {
      nodes {
        __typename
        ${PULL_REQUEST_TIMELINE_ITEMS}
      }
    }
  }
}
`;
