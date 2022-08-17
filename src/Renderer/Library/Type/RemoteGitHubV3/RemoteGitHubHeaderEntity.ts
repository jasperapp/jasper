export type RemoteGitHubHeaderEntity = {
  gheVersion: string | null;
  scopes: Array<'repo' | 'user' | 'read:user' | 'notifications' | 'read:org' | 'read:project' | string>;
  fulfillRateLimit: boolean;
}
