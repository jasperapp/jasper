import {GitHubV4Client} from './GitHubV4Client';

export class GitHubSearchV4Client extends GitHubV4Client {
  async search(searchQuery: string) {
    const query = QUERY.replace(`___SEARCH_QUERY___`, searchQuery);
    const {error, body} = await this.request(query);
    if (error) return console.error(error);
    console.log(body);
  }
}

const ISSUE_SCHEME = `
__typename
assignees(first: 10) {
  edges {
    node {
      avatarUrl
      login
      name
    }
  }
}
author {
  avatarUrl
  login
  ... on User {
    name
  }
}
body
closedAt
comments {
  totalCount
}
createdAt
databaseId
labels(first: 10) {
  edges {
    node {
      color
      id
      name
      url
    }
  }
}
milestone {
  id
  title
  dueOn
  url
}
number
repository {
  owner {
    login
  }
  name
  isPrivate
}
title
updatedAt
url
`;

const QUERY = `
query { 
  search(query: "___SEARCH_QUERY___", type: ISSUE, last: 100) {
    edges {
      node {
        ... on Issue {
          ${ISSUE_SCHEME}
          issueState: state
        }
        ... on PullRequest {
          ${ISSUE_SCHEME}
          prState: state
          mergedAt
          isDraft
        }
      }
    }
  }
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
`;
