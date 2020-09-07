import {RemoteGitHubV4Entity} from './RemoteGitHubV4Entity';

export type RemoteGitHubV4IssueNodesEntity = RemoteGitHubV4Entity & {
  nodes: RemoteGitHubV4IssueEntity[];
}

export type RemoteGitHubV4IssueEntity = {
  __typename: 'Issue' | 'PullRequest';
  updatedAt: string;
  author: {
    login: string;
  };
  number: number;
  repository: {
    nameWithOwner: string; // foo/bar
    isPrivate: boolean;
  };
  participants: {
    nodes: RemoteGithubV4UserEntity[];
  };
  timelineItems: {
    nodes: RemoteGitHubV4TimelineItemEntity[];
  }
  projectCards: {
    nodes: RemoteGitHubV4ProjectCard[];
  };
  lastTimelineUser: string;
  lastTimelineAt: string;

  // only pull request
  isDraft?: boolean;
  mergedAt?: string;
  reviewRequests: {
    nodes: {requestedReviewer: RemoteGithubV4UserEntity}[];
  };
}

export type RemoteGithubV4UserEntity = {
  login: string;
  avatarUrl: string;
  name: string;

  // for team
  slug?: string;
  teamName?: string;
  teamAvatarUrl?: string;
}

export type RemoteGitHubV4ProjectCard = {
  project: {
    url: string;
    name: string;
  };
  column: {
    name: string;
  };
}

// https://docs.github.com/en/graphql/reference/unions#issuetimelineitems
// https://docs.github.com/en/graphql/reference/unions#pullrequesttimelineitems
export type RemoteGitHubV4TimelineItemEntity = {
  __typename: string;

  // basic
  actor?: {login: string};
  createdAt?: string;

  // IssueComment, PullRequestReview
  author?: {login: string};
  editor?: {login: string};
  updatedAt?: string;

  // PullRequestCommit
  commit?: {
    pushedDate: string;
    author: {
      user: {
        login: string;
      }
    }
  }

  // PullRequestCommitCommentThread, PullRequestReviewThread
  comments?: {
    nodes: Array<{
      createdAt?: string;
      updatedAt?: string;
      author?: {login: string};
      editor?: {login: string};
    }>;
  }

  // PullRequestRevisionMarker
  lastSeenCommit?: {
    pushedDate: string;
    author: {
      user: {
        login: string;
      }
    }
  }
}
