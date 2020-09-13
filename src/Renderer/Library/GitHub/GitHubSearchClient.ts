import {GitHubClient} from './GitHubClient';
import {RemoteIssueEntity} from '../Type/RemoteGitHubV3/RemoteIssueEntity';
import {RemoteGitHubHeaderEntity} from '../Type/RemoteGitHubV3/RemoteGitHubHeaderEntity';

export class GitHubSearchClient extends GitHubClient {
  // search apiへのアクセス過多を検知する。
  // 1sec以内のアクセスが10回連続したら、例外を投げる
  // そうなった場合は、不具合の可能性が高い
  private static warningCount: number = 0;
  private static lastSearchedAt: number = 0;
  private static checkOverExcess() {
    const now = Date.now();
    if (now - this.lastSearchedAt < 1000) {
      this.warningCount++;
    } else {
      this.warningCount = 0;
    }
    this.lastSearchedAt = now;

    if (this.warningCount >= 10) {
      throw new Error('over excess calling search api');
    }
  }

  async search(searchQuery: string, page = 1, perPage = 100): Promise<{error?: Error; issues?: RemoteIssueEntity[]; totalCount?: number; githubHeader?: RemoteGitHubHeaderEntity}>  {
    const path = '/search/issues';

    GitHubSearchClient.checkOverExcess();

    const query = {
      per_page: perPage,
      page: page,
      sort: 'updated',
      order: 'desc',
      q: searchQuery
    };

    const {error, body, githubHeader} = await this.request<{items: RemoteIssueEntity[]; total_count: number}>(path, query);
    if (error) return {error};

    // v4 apiによってinjectされるが、デフォルト値を入れておく
    body.items.forEach(item => {
      item.private = item.private ?? false;
      item.draft = item.draft ?? false;
      item.involves = item.involves ?? [];
      item.requested_reviewers = item.requested_reviewers ?? [];
      item.last_timeline_user = '';
      item.last_timeline_at = '';
      item.projects = [];
    });

    return {issues: body.items, totalCount: body.total_count, githubHeader};
  }
}
