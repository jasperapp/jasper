import {RemoteGitHubV4Entity} from './RemoteGitHubV4Entity';

export type RemoteGitHubV4IssueNodesEntity = RemoteGitHubV4Entity & {
  nodes: RemoteGitHubV4IssueEntity[];
}

export type RemoteGitHubV4IssueEntity = {
  __typename: 'Issue' | 'PullRequest';
  number: number;
  repository: {
    nameWithOwner: string; // foo/bar
    isPrivate: boolean;
  };
  participants: {
    nodes: RemoteGithubV4UserEntity[];
  };

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
}
