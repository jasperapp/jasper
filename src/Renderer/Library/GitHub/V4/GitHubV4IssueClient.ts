import dayjs from 'dayjs';
import {Logger} from '../../Infra/Logger';
import {RemoteIssueEntity, RemoteProjectEntity, RemoteProjectFieldEntity, RemoteReviewEntity, RemoteUserEntity} from '../../Type/RemoteGitHubV3/RemoteIssueEntity';
import {RemoteGitHubV4IssueEntity, RemoteGitHubV4IssueNodesEntity, RemoteGitHubV4Review, RemoteGitHubV4TimelineItemEntity} from '../../Type/RemoteGitHubV4/RemoteGitHubV4IssueNodesEntity';
import {ArrayUtil} from '../../Util/ArrayUtil';
import {TimerUtil} from '../../Util/TimerUtil';
import {GitHubV4Client, PartialError} from './GitHubV4Client';

type PartialIssue = {
  node_id: string;
  html_url: string;
}

export class GitHubV4IssueClient extends GitHubV4Client {
  static injectV4ToV3(v4Issues: RemoteGitHubV4IssueEntity[], v3Issues: RemoteIssueEntity[]) {
    for (const v3Issue of v3Issues) {
      const v4Issue = v4Issues.find(v4Issue => v4Issue.node_id === v3Issue.node_id);
      if (!v4Issue) {
        console.warn(`not found v4Issue. node_id = ${v3Issue.node_id}`);
        continue;
      }

      // 共通
      v3Issue.private = v4Issue.repository.isPrivate;
      v3Issue.involves = this.getInvolves(v4Issue);
      v3Issue.mentions = this.getMentions(v4Issue);
      v3Issue.last_timeline_user = v4Issue.lastTimelineUser;
      v3Issue.last_timeline_at = v4Issue.lastTimelineAt;
      v3Issue.last_timeline_type = v4Issue.lastTimelineType;

      // Projects removed as they are sunset
      v3Issue.projects = [];
      v3Issue.projectFields = [];
      v3Issue.requested_reviewers = [];
      v3Issue.reviews = [];

      // PRのみ
      if (v4Issue.__typename === 'PullRequest') {
        v3Issue.merged_at = v4Issue.mergedAt;
        v3Issue.mergeable = v4Issue.mergeable;
        v3Issue.draft = v4Issue.isDraft;
        v3Issue.requested_reviewers = this.getReviewRequests(v4Issue);
        v3Issue.reviews = this.getReviewsAtGroupByUser(v4Issue);
      }
    }
  }

  private static getInvolves(v4Issue: RemoteGitHubV4IssueEntity): RemoteUserEntity[] {
    const involves: RemoteUserEntity[] = [];

    // workaround: participantsが空の場合が何故か発生するので、authorを明示的にinvolvesに入れる
    // orgのvisibleじゃないユーザがauthorの場合はparticipantsに表示されないぽい？
    involves.push({
      login: v4Issue.author?.login ?? 'ghost', // 削除されたユーザの場合`author`はnullになり、github.com/ghostが削除ユーザの代替えアカウントとなる。
      name: v4Issue.author?.login ?? 'ghost',
      avatar_url: v4Issue.author?.avatarUrl ?? 'https://avatars.githubusercontent.com/u/10137?s=80&v=4',
    });

    // workaround: participantsが空の場合が何故か発生するので、assigneesを明示的にinvolvesに入れる
    // orgのvisibleじゃないユーザがassigneeの場合はparticipantsに表示されないぽい？
    if (v4Issue.assignees?.nodes?.length) {
      const users = v4Issue.assignees.nodes.map(node => {
        return {
          login: node.login,
          name: node.name,
          avatar_url: node.avatarUrl,
        };
      });

      users.forEach(user => {
        if (!involves.find(involve => involve.login === user.login)) involves.push(user);
      });
    }

    // participants
    if (v4Issue.participants?.nodes?.length) {
      const users = v4Issue.participants.nodes.map(node => {
        return {
          login: node.login,
          name: node.name,
          avatar_url: node.avatarUrl,
        };
      });

      users.forEach(user => {
        if (!involves.find(involve => involve.login === user.login)) involves.push(user);
      });
    }

    // review requests
    this.getReviewRequests(v4Issue).forEach(user => {
      if (!involves.find(involve => involve.login === user.login)) involves.push(user);
    });

    // mentions
    this.getMentions(v4Issue).forEach(user => {
      if (!involves.find(involve => involve.login === user.login)) involves.push(user);
    });

    return involves;
  }

  private static getMentions(v4Issue: RemoteGitHubV4IssueEntity): RemoteUserEntity[] {
    if (v4Issue.mentions?.length) {
      return v4Issue.mentions.map<RemoteUserEntity>(mention => {
        return {
          login: mention,
          name: mention,
          avatar_url: null,
        };
      });
    } else {
      return [];
    }
  }

  // Project methods removed as GitHub Projects classic has been sunset

  // Project methods removed as GitHub Projects classic has been sunset

  // Project methods removed as GitHub Projects classic has been sunset

  private static getReviewRequests(v4Issue: RemoteGitHubV4IssueEntity): RemoteUserEntity[] {
    if (v4Issue.reviewRequests?.nodes?.length) {
      return v4Issue.reviewRequests?.nodes?.map(node => {
        return {
          login: node.requestedReviewer?.login || node.requestedReviewer?.teamLogin,
          name: node.requestedReviewer?.name || node.requestedReviewer?.teamName,
          avatar_url: node.requestedReviewer?.avatarUrl || node.requestedReviewer?.teamAvatarUrl,
        };
      });
    } else {
      return [];
    }
  }

  // ユーザごとの最終reviewを返す。ただし、approveとchanges_requestedをcommentedよりも優先する.
  private static getReviewsAtGroupByUser(v4Issue: RemoteGitHubV4IssueEntity): RemoteReviewEntity[] {
    if (!v4Issue.reviews?.nodes?.length) return [];

    const results: RemoteGitHubV4Review[] = [];

    const allReviews = v4Issue.reviews.nodes
      .filter(node => node.author?.login)
      // 最新のreviewを.findできるように並び替えておく
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    const loginNames = ArrayUtil.unique<string>(allReviews.map(node => node.author?.login));
    for (const loginName of loginNames) {
      const reviews = allReviews.filter(node => node.author.login === loginName);
      const review1 = reviews.find(review => review.state === 'APPROVED' || review.state === 'CHANGES_REQUESTED');
      const review2 = reviews.find(review => review.state === 'COMMENTED');
      if (review1 || review2) results.push(review1 || review2);
    }

    return results.map<RemoteReviewEntity>(review => {
      return {
        login: review.author.login,
        avatar_url: review.author.avatarUrl,
        state: review.state,
        updated_at: review.updatedAt,
      };
    });
  }

  async getIssuesByNodeIds(requestIssues: PartialIssue[]): Promise<{ error?: Error; issues?: RemoteGitHubV4IssueEntity[]; notFoundIssues?: PartialIssue[]; partialErrors?: PartialError[]; }> {
    const validRequestIssues = requestIssues.filter(issue => issue.node_id);
    const allIssues: RemoteGitHubV4IssueEntity[] = [];
    const notFoundIssues: PartialIssue[] = [];
    const partialErrors: PartialError[] = [];
    // 一度に問い合わせるnode_idの数が多いとタイムアウトしてしまうので、sliceする
    // GHEの場合、rate limitが制限されている(200回?)ので、sliceの数を大きくする
    const slice = this.isGitHubCom ? 20 : 34;
    const promises: Promise<{ error?: Error; issues?: RemoteGitHubV4IssueEntity[], notFoundIssues?: PartialIssue[]; partialErrors?: PartialError[] }>[] = [];
    for (let i = 0; i < validRequestIssues.length; i += slice) {
      const p = this.getIssuesByNodeIdsInternal(validRequestIssues.slice(i, i + slice));
      promises.push(p);

      if (validRequestIssues.length > slice) await TimerUtil.sleep(1000);
    }

    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return {error};

    results.forEach(res => {
      allIssues.push(...res.issues);
      notFoundIssues.push(...res.notFoundIssues)
      partialErrors.push(...res.partialErrors);
    });

    return {issues: allIssues, notFoundIssues, partialErrors};
  }

  private async getIssuesByNodeIdsInternal(requestIssues: PartialIssue[]): Promise<{ error?: Error; issues?: RemoteGitHubV4IssueEntity[], notFoundIssues?: PartialIssue[]; partialErrors?: PartialError[] }> {
    const nodeIds = requestIssues.filter(issue => issue.node_id).map(issue => `"${issue.node_id}"`);
    const joinedNodeIds = ArrayUtil.unique(nodeIds).join(',');
    const query = this.getQueryTemplate().replace(`__NODE_IDS__`, joinedNodeIds);
    const {error, data, partialErrors} = await this.request<RemoteGitHubV4IssueNodesEntity>(query);
    if (error) return {error};

    // nodeIdが存在しない場合、nullのものが返ってくるのでfilterする
    // たとえばissueが別のリポジトリに移動していた場合はnodeIdが変わるようだ。
    const issues = data.nodes.filter(node => node);

    // Project references removed as GitHub Projects classic has been sunset
    // Initialize empty project fields to prevent null pointer exceptions
    issues.forEach(issue => {
      issue.projectItems = {nodes: []};
      issue.projectCards = {nodes: []};
    });

    const foundNodeIds = issues.map(issue => issue.node_id);
    const notFoundIssues = requestIssues.filter(issue => !foundNodeIds.includes(issue.node_id));

    // log
    if (notFoundIssues.length > 0) {
      Logger.error(GitHubV4IssueClient.name, `not found issues: ${notFoundIssues.length} count`, {
        notFoundIssues: notFoundIssues.map(issue => issue.html_url),
      });
    }

    // inject mentions
    for (const issue of issues) {
      const {mentions} = this.getMentions(issue);
      issue.mentions = mentions;
    }

    // inject last timeline
    for (const issue of issues) {
      const {timelineUser, timelineAt, timelineType} = this.getLastTimelineInfo(issue);
      issue.lastTimelineUser = timelineUser;
      issue.lastTimelineAt = timelineAt;
      issue.lastTimelineType = timelineType;

      // timelineだけではなく、レビューコメントも見る必要がある。
      // もしレビューコメントのほうがあたらしければそちらを採用する。
      const {reviewCommentUser, reviewCommentAt} = this.getLastReviewCommentInfo(issue);
      if (reviewCommentUser != null && reviewCommentAt != null) {
        if (new Date(issue.lastTimelineAt) < new Date(reviewCommentAt)) {
          issue.lastTimelineUser = reviewCommentUser;
          issue.lastTimelineAt = reviewCommentAt;
          issue.lastTimelineType = 'ReviewThreadComment';
        }
      }
    }

    return {issues, notFoundIssues, partialErrors};
  }

  // 古いGHEでは使えいない型を除外する
  private getQueryTemplate(): string {
    if (this.isGitHubCom) return GITHUB_QUERY_TEMPLATE;

    // gheVersion format = `2.19.5`
    const tmp = this.gheVersion.split('.');
    const major = parseInt(tmp[0], 10);
    const minor = parseInt(tmp[1], 10);

    if (major >= 3) return GHE_QUERY_TEMPLATE;

    const notAvailableTypeNames: string[] = [];

    // v2.20以下では使用できない
    if (minor <= 20) {
      notAvailableTypeNames.push(
        'ConnectedEvent',
        'DisconnectedEvent',
        'UnmarkedAsDuplicateEvent',
        'ConvertToDraftEvent',
        'isDraft',
      );
    }

    // 現時点(2020-09-06)での最新(v2.21)でも使用できない
    if (minor <= 21) {
      notAvailableTypeNames.push(
        'AutomaticBaseChangeFailedEvent',
        'AutomaticBaseChangeSucceededEvent',
      );
    }

    let safeQueryTemplate: string = GHE_QUERY_TEMPLATE;
    for (const notAvailableTypeName of notAvailableTypeNames) {
      safeQueryTemplate = safeQueryTemplate.replace(new RegExp(`.*${notAvailableTypeName}.*`, 'g'), '');
    }

    return safeQueryTemplate;
  }

  // todo: PullRequestReviewのcommentsのなかのメンションまでは拾えていない(実用的にはほとんど問題なさそうなので対応してない)
  // todo: PullRequestReviewThreadのcommentsのなかのメンションまでは拾えていない(実用的にはほとんど問題なさそうなので対応してない)
  private getMentions(issue: RemoteGitHubV4IssueEntity): {mentions: string[]} {
    const comments: string[] = [];

    // issue body
    if (issue.bodyHTML) comments.push(issue.bodyHTML);

    // issue comment
    if (issue.timelineItems?.nodes?.length) {
      const bodyHTMLs = issue.timelineItems.nodes.filter(e=>e).map(node => node.bodyHTML).filter(bodyHTML => bodyHTML);
      comments.push(...bodyHTMLs);
    }

    if (!comments.length) return {mentions: []};

    // parse mention
    const mentions: string[] = [];
    const parser = new DOMParser();
    for (const comment of comments) {
      const doc = parser.parseFromString(comment, 'text/html');
      const mentionEls = Array.from(doc.querySelectorAll('.team-mention, .user-mention'));
      mentions.push(...mentionEls.map(mentionEl => mentionEl.textContent.replace('@', '')));
    }

    return {mentions: ArrayUtil.unique(mentions)};
  }

  private getLastTimelineInfo(issue: RemoteGitHubV4IssueEntity): { timelineUser: string, timelineAt: string, timelineType: string } {
    // timelineがない == descしかない == 新規issue
    if (!issue.timelineItems?.nodes?.length) {
      return {timelineUser: issue.author?.login, timelineAt: issue.updatedAt, timelineType: `New${issue.__typename}`};
    }

    const timelineItems = [...issue.timelineItems.nodes].filter(e=>e);
    timelineItems.sort((timeline1, timeline2) => {
      const {timelineAt: timelineAt1} = this.getTimelineInfo(issue, timeline1);
      const {timelineAt: timelineAt2} = this.getTimelineInfo(issue, timeline2);
      return new Date(timelineAt2).getTime() - new Date(timelineAt1).getTime();
    });

    const timelineItem = timelineItems[0];
    const {timelineUser, timelineAt} = this.getTimelineInfo(issue, timelineItem);

    // PRを出した直後は、timelineのPullRequestCommit(pushedDate)はissue.updatedAtよりも古い
    // なのでPullRequestCommit(pushedDate)ではなく、issue.updated_atを使う
    if (timelineItem.__typename === 'PullRequestCommit' && timelineAt < issue.updatedAt) {
      return {timelineUser: issue.author?.login, timelineAt: issue.updatedAt, timelineType: timelineItem.__typename};
    } else {
      return {timelineUser, timelineAt, timelineType: timelineItem.__typename};
    }
  }

  private getTimelineInfo(issue: RemoteGitHubV4IssueEntity, timelineItem: RemoteGitHubV4TimelineItemEntity): {timelineUser: string; timelineAt: string} {
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
      || timelineItem.commit?.authoredDate
      || timelineItem.commit?.committedDate
      || timelineItem.comments?.nodes?.[0]?.updatedAt
      || timelineItem.comments?.nodes?.[0]?.createdAt
      || timelineItem.lastSeenCommit?.pushedDate
      || timelineItem.lastSeenCommit?.authoredDate
      || timelineItem.lastSeenCommit?.committedDate
      || issue.createdAt;

    return {timelineUser, timelineAt};
  }

  private getLastReviewCommentInfo(issue: RemoteGitHubV4IssueEntity): { reviewCommentUser: string | null; reviewCommentAt: string | null } {
    if (issue.reviewThreads?.nodes.length == null) return {reviewCommentAt: null, reviewCommentUser: null};

    const comments = issue.reviewThreads.nodes.flatMap(node => node.comments.nodes);
    if (comments.length === 0) return {reviewCommentAt: null, reviewCommentUser: null};

    comments.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return {reviewCommentUser: comments[0].author?.login, reviewCommentAt: comments[0].updatedAt};
  }
}

const COMMON_QUERY_TEMPLATE = `
  __typename
  bodyHTML
  createdAt
  updatedAt
  author {
    login
    avatarUrl
  }
  number
  repository {
    nameWithOwner
    isPrivate
  }      
  assignees(first: 100) {
    nodes {
      login
      avatarUrl
      name
    }
  }
  participants(first: 100) {
    nodes {
      login
      avatarUrl
      name
    }
  }
  # Project references removed as GitHub Projects classic has been sunset
`;

// GitHub Project V2 template removed as GitHub Projects has been sunset

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
... on IssueComment {__typename createdAt updatedAt author {login} editor {login} bodyHTML}
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
... on AddedToProjectEvent {__typename createdAt actor {login}}
... on AssignedEvent {__typename createdAt actor {login}}
... on AutomaticBaseChangeFailedEvent {__typename createdAt actor {login}}
... on AutomaticBaseChangeSucceededEvent {__typename createdAt actor {login}}
... on BaseRefChangedEvent {__typename createdAt actor {login}}
... on BaseRefForcePushedEvent {__typename createdAt actor {login}}
... on ClosedEvent {__typename createdAt actor {login}}
... on CommentDeletedEvent {__typename createdAt actor {login}}
... on ConnectedEvent {__typename createdAt actor {login}}
... on ConvertToDraftEvent {__typename createdAt actor {login}}
... on ConvertedNoteToIssueEvent {__typename createdAt actor {login}}
... on CrossReferencedEvent {__typename createdAt actor {login}}
... on DemilestonedEvent {__typename createdAt actor {login}}
... on DeployedEvent {__typename createdAt actor {login}}
... on DeploymentEnvironmentChangedEvent {__typename createdAt actor {login}}
... on DisconnectedEvent {__typename createdAt actor {login}}
... on HeadRefDeletedEvent {__typename createdAt actor {login}}
... on HeadRefForcePushedEvent {__typename createdAt actor {login}}
... on HeadRefRestoredEvent {__typename createdAt actor {login}}
# not actor
... on IssueComment {__typename createdAt updatedAt author {login} editor{login} bodyHTML}
... on LabeledEvent {__typename createdAt actor {login}}
... on LockedEvent {__typename createdAt actor {login}}
... on MarkedAsDuplicateEvent {__typename createdAt actor {login}}
... on MentionedEvent {__typename createdAt actor {login}}
... on MergedEvent {__typename createdAt actor {login}}
... on MilestonedEvent {__typename createdAt actor {login}}
... on MovedColumnsInProjectEvent {__typename createdAt actor {login}}
... on PinnedEvent {__typename createdAt actor {login}}
# not actor
... on PullRequestCommit {__typename commit {pushedDate committedDate authoredDate author {user {login}}}}
# not actor
... on PullRequestCommitCommentThread {__typename comments(last: 1) {nodes {createdAt updatedAt editor {login}}}}
# not actor
... on PullRequestReview {__typename createdAt updatedAt author {login} editor {login} bodyHTML}
# not actor
... on PullRequestReviewThread {__typename comments(last: 1) {nodes {createdAt updatedAt author {login} editor {login}}}}
# not actor
... on PullRequestRevisionMarker {__typename  lastSeenCommit {pushedDate committedDate authoredDate author {user {login}}}}
... on ReadyForReviewEvent {__typename createdAt actor {login}}
... on ReferencedEvent {__typename createdAt actor {login}}
... on RemovedFromProjectEvent {__typename createdAt actor {login}}
... on RenamedTitleEvent {__typename createdAt actor {login}}
... on ReopenedEvent {__typename createdAt actor {login}}
... on ReviewDismissedEvent {__typename createdAt actor {login}}
... on ReviewRequestRemovedEvent {__typename createdAt actor {login}}
... on ReviewRequestedEvent {__typename createdAt actor {login}}
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

const QUERY_TEMPLATE = `
nodes(ids: [__NODE_IDS__]) {
  node_id: id

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
    mergeable
    mergedAt
    reviewRequests(first:100) {
      nodes {
        requestedReviewer {
          ... on  User {
            login
            avatarUrl
            name
          }
          ... on Team {
            teamLogin: combinedSlug
            teamName: name
            teamAvatarUrl: avatarUrl
          }
        }
      }
    }
    reviews(first: 100) {
      nodes {
        author {
          login
          avatarUrl
        }
        state
        updatedAt
      }
    }
    reviewThreads(last: 100) {
      nodes {
        comments(last: 100) {
          nodes {
            author {
              login
              avatarUrl
            }
            updatedAt
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

// Project references removed as GitHub Projects classic has been sunset
const GITHUB_QUERY_TEMPLATE = QUERY_TEMPLATE;
const GHE_QUERY_TEMPLATE = QUERY_TEMPLATE;
