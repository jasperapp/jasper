export type RemoteGitHubV4RateLimitEntity = {
    cost: number;
    limit: number;
    remaining: number;
    resetAt: string; // YYYY-MM-DDThh:mm:ssZ
}

export type RemoteGitHubV4Entity = {
  rateLimit?: RemoteGitHubV4RateLimitEntity;
}
