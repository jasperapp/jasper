import {GitHubV4Client} from './GitHubV4Client';
import {
  RemoteGitHubV4IssueEntity,
  RemoteGitHubV4IssueNodesEntity
} from '../../Type/RemoteGitHubV4/RemoteGitHubV4IssueNodesEntity';

export class GitHubV4IssueClient extends GitHubV4Client {
  async getIssuesByNodeIds(nodeIds: string[]): Promise<{error?: Error; issues?: RemoteGitHubV4IssueEntity[]}> {
    const joinedNodeIds = nodeIds.map(nodeId => `"${nodeId}"`).join(',');
    const query = QUERY_TEMPLATE.replace(`__NODE_IDS__`, joinedNodeIds);
    const {error, data} = await this.request<RemoteGitHubV4IssueNodesEntity>(query);
    if (error) return {error};

    return {issues: data.nodes};
  }
}

const COMMON_QUERY_TEMPLATE = `
  __typename
  number
  repository {
    nameWithOwner
    isPrivate
  }      
  participants(first: 100) {
    nodes {
      login
      avatarUrl
      name
    }
  }
`;

const QUERY_TEMPLATE = `
nodes(ids: [__NODE_IDS__]) {
  ... on Issue {
    ${COMMON_QUERY_TEMPLATE}
  }
  
  ... on PullRequest {
    ${COMMON_QUERY_TEMPLATE}
    isDraft
    mergedAt
    reviewRequests(first:100) {
      nodes {
        requestedReviewer {
          ... on  User {
            login
            avatarUrl
            name
          }
        }
      }
    }
  }
}
`;
