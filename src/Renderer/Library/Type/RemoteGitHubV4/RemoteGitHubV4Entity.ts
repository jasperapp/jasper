export type RemoteGitHubV4Entity = {
  rateLimit: {
    cost: number;
    limit: number;
    remaining: number;
    resetAt: string; // YYYY-MM-DDThh:mm:ssZ
  }
  errors?: {message: string}[];
}
