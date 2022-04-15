import {RemoteGitHubV4Entity} from './RemoteGitHubV4Entity';

export type RemoteGitHubV4IssueNodesEntity = RemoteGitHubV4Entity & {
  nodes: RemoteGitHubV4IssueEntity[];
}

export type RemoteGitHubV4IssueEntity = {
  __typename: 'Issue' | 'PullRequest';
  node_id: string;
  bodyHTML: string;
  updatedAt: string;
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  number: number;
  repository: {
    nameWithOwner: string; // foo/bar
    isPrivate: boolean;
  };
  assignees: {
    nodes: RemoteGithubV4UserEntity[];
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
  projectNextItems: {
    nodes: RemoteGitHubV4ProjectNextItem[];
  };
  lastTimelineUser: string;
  lastTimelineAt: string;
  lastTimelineType: string;
  mentions: string[];

  // only pull request
  isDraft?: boolean;
  mergedAt?: string;
  mergeable?: 'CONFLICTING' | 'MERGEABLE' | 'UNKNOWN';
  reviewRequests?: {
    nodes: { requestedReviewer: RemoteGithubV4UserEntity }[];
  };
  reviews?: {
    nodes: RemoteGitHubV4Review[];
  };
  reviewThreads?: {
    nodes: RemoteGitHubV4ReviewThread[];
  }
}

export type RemoteGitHubV4ReviewThread = {
  comments: {
    nodes: RemoteGitHubV4ReviewThreadComment[]
  };
};

export type RemoteGitHubV4ReviewThreadComment = {
  author: {
    login: string;
    avatarUrl: string;
  };
  updatedAt: string;
};

export type RemoteGithubV4UserEntity = {
  login: string;
  avatarUrl: string;
  name: string;

  // for team
  teamLogin?: string;
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

export type RemoteGitHubV4ProjectNextItem = {
  fieldValues: {
    nodes: RemoteGitHubV4ProjectNextFieldValue[];
  }
}

export type RemoteGitHubV4ProjectNextFieldValue = {
  projectField : {
    name: string;
    settings: string;
    dataType: 'TITLE' | 'SINGLE_SELECT' | 'ITERATION' | 'TEXT' | 'NUMBER' | 'DATE' | 'EXPANDED_ITERATION' | string;
    project: {
      title: string;
      url: string;
    }
  };
  value: string;
}

export type RemoteGitHubV4Review = {
  author: {
    login: string;
    avatarUrl: string;
  }
  state: 'APPROVED' | 'COMMENTED' | 'CHANGES_REQUESTED';
  updatedAt: string;
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
  bodyHTML?: string; // only IssueComment

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
