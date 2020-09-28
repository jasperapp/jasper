export type RemoteIssueEntity = {
  id: number;
  pull_request: {
    url: string;
  };
  title: string;
  number: number;
  user: RemoteUserEntity;
  labels: RemoteLabelEntity[];
  milestone: RemoteMilestoneEntity;
  created_at: string;
  updated_at: string;
  closed_at: string;
  draft: boolean;
  url: string;
  html_url: string;
  body: string;
  assignees: RemoteUserEntity[];
  assignee: RemoteUserEntity;
  comments: number;
  node_id: string;

  // injected from v4
  private: boolean;
  merged_at: string;
  mergeable?: 'CONFLICTING' | 'MERGEABLE' | 'UNKNOWN';
  involves: RemoteUserEntity[];
  mentions: RemoteUserEntity[];
  requested_reviewers: RemoteUserEntity[];
  reviews: RemoteReviewEntity[];
  last_timeline_user: string;
  last_timeline_at: string;
  projects: RemoteProjectEntity[];
}

export type RemoteUserEntity = {
  login: string;
  name: string;
  avatar_url: string;
}

type RemoteLabelEntity = {
  id: number;
  name: string;
  color: string;
}

type RemoteMilestoneEntity = {
  title: string;
  due_on: string;
  html_url: string;
}

export type RemoteProjectEntity = {
  url: string;
  name: string;
  column: string;
}

export type RemoteReviewEntity = {
  login: string;
  avatar_url: string;
  state: 'APPROVED' | 'COMMENTED' | 'CHANGES_REQUESTED';
  updated_at: string;
}
