export type GitHubQueryType = {
  is: {
    issue?: boolean;
    pr?: boolean;
    open?: boolean;
    closed?: boolean;
    read?: boolean;
    unread?: boolean;
    bookmark?: boolean;
    unbookmark?: boolean;
    archived?: boolean;
    unarchived?: boolean;
    merged?: boolean;
    unmerged?: boolean;
    draft?: boolean;
    undraft?: boolean;
    private?: boolean;
    unprivate?: boolean;
  };
  no: {
    label?: boolean;
    milestone?: boolean;
    assignee?: boolean;
    dueon?: boolean;
    project?: boolean;
  };
  have: {
    label?: boolean;
    milestone?: boolean;
    assignee?: boolean;
    dueon?: boolean;
    project?: boolean;
  };
  numbers: string[];
  titles: string[];
  authors: string[];
  assignees: string[];
  involves: string[];
  mentions: string[];
  teams: string[];
  'review-requested': string[];
  'reviewed-by': string[];
  milestones: string[];
  'project-names': string[];
  'project-columns': string[];
  "project-fields": string[];
  users: string[];
  repos: string[];
  labels: string[];
  keywords: string[];
  sort: string;
}
