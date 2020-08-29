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
