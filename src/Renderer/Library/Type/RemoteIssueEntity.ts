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
  involves: RemoteUserEntity[];
  requested_reviewers: RemoteUserEntity[];
  last_timeline_user: string;
  last_timeline_at: string;
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
