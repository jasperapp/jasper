import {GitHubClient} from './GitHubClient';
import {Response} from './GitHubClient';

export class GitHubSearchClient extends GitHubClient {
  async search(searchQuery: string, page = 1, perPage = 100): Promise<Response>  {
    const query = {
      per_page: perPage,
      page: page,
      sort: 'updated',
      order: 'desc',
      q: searchQuery
    };

    return this.request('/search/issues', query);
  }
}
