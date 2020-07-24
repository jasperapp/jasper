import {GitHubClient} from './GitHubClient';
import {Response} from './GitHubClient';

type Interval = {
  path: string;
  latestAt: number;
  warningCount: number;
}

export class GitHubSearchClient extends GitHubClient {
  private static intervals: Interval[] = [];

  private static checkInterval(path: string): boolean {
    let interval = this.intervals.find(v => v.path === path);
    if (!interval) {
      interval = {path, latestAt: 0, warningCount: 0};
      this.intervals.push(interval);
    }

    const now = Date.now();
    const diffMillSec = now - interval.latestAt;
    if (diffMillSec <= 10 * 1000) {
      interval.warningCount++;
      console.warn(`GitHubSearchClient: warning check interval: path = ${path}`);
    }
    interval.latestAt = now;

    if (interval.warningCount >= 3) {
      console.error(`GitHubSearchClient: error check interval: path = ${path}`);
      return false;
    } else {
      return true;
    }
  }

  async search(searchQuery: string, page = 1, perPage = 100): Promise<Response>  {
    const path = '/search/issues';
    if (!GitHubSearchClient.checkInterval(path)) {
      return {error: new Error(`GitHubClient: checkInterval() is fail`)};
    }

    const query = {
      per_page: perPage,
      page: page,
      sort: 'updated',
      order: 'desc',
      q: searchQuery
    };

    return this.request(path, query);
  }
}
