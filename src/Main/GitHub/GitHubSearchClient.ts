import {GitHubClient} from './GitHubClient';

export class GitHubSearchClient extends GitHubClient {
  requestImmediate(searchQuery, page = 1, perPage = 100) {
    const query = {
      per_page: perPage,
      page: page,
      sort: 'updated',
      order: 'desc',
      q: searchQuery
    };
    return super.requestImmediate('/search/issues', query);
  }

  request(searchQuery, page = 1, perPage = 100)  {
    const query = {
      per_page: perPage,
      page: page,
      sort: 'updated',
      order: 'desc',
      q: searchQuery
    };
    return super.request('/search/issues', query);
  }
}
