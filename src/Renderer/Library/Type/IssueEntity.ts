import {RemoteIssueEntity} from './RemoteIssueEntity';

export type IssueEntity = {
  id: number;
  type: 'pr' | 'issue';
  title: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
  merged_at: string;
  read_at: string;
  prev_read_at: string;
  archived_at: string;
  marked_at: string;
  number: number;
  user: string;
  repo: string;
  author: string;
  assignees: string;
  labels: string;
  milestone: string;
  due_on: string;
  draft: number;
  repo_private: number;
  involves: string;
  review_requested: string;
  last_timeline_user: string;
  last_timeline_at: string;
  html_url: string;
  body: string;
  read_body: string;
  prev_read_body: string;
  value: RemoteIssueEntity;
}
