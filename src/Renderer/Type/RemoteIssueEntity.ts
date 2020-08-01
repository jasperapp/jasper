export type RemoteIssueEntity = {
  id: number;
  pull_request: any;
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
}

type RemoteUserEntity = {
  login: string;
}

type RemoteLabelEntity = {
  name: string;
}

type RemoteMilestoneEntity = {
  title: string;
  due_on: string;
}
