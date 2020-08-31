export type GetIssueStateEntity = {
  repo: string; // `foo/bar`
  issueType: 'pr' | 'issue';
  issueNumber: number;
  issueState: 'open' | 'closed' | 'merged' | 'draft';
}
