export type RemoteGitHubHeaderEntity = {
  gheVersion: string | null;
  scopes: Array<'repo' | 'user' | 'notifications' | 'read:org' | string>;
}
