export type IssueEntity = {
  id: number;
  type: string;
  title: string;
  created_at: string;
  updated_at: string;
  closed_at: string;
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
  html_url: string;
  body: string;
  read_body: string;
  prev_read_body: string;
  value: string;
}
