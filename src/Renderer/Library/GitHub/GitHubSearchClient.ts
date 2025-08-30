import {RemoteGitHubHeaderEntity} from '../Type/RemoteGitHubV3/RemoteGitHubHeaderEntity';
import {RemoteIssueEntity} from '../Type/RemoteGitHubV3/RemoteIssueEntity';
import {GitHubClient} from './GitHubClient';

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
      q: searchQuery,
      // 2025-09-04からadvanced_searchが強制的に有効になる
      // advanced_searchでは空白はANDと認識されてしまう（これまでOR認識だった）
      // `is:pr repo:a/b repo:c/d` は`リポジトリa/bかつc/dに含まれるPR` と解釈され、そのようなPRは存在しないので、結果として0件となる
      // これはjasperのクエリが意図せぬ挙動となるため、ユーザ自身でクエリを変更して貰う必要がある
      // そのため、9/4を迎える前にadvanced_searchを有効にして、jasperをリリースする必要がある
      // https://github.blog/changelog/2025-03-06-github-issues-projects-api-support-for-issues-advanced-search-and-more/
      advanced_search: true,
    };

    const {error, body, githubHeader, statusCode} = await this.request<{items: RemoteIssueEntity[]; total_count: number}>(path, query);
    if (error) {

      // issueがまったくない、もしくは何かしらの理由でアクセス権がない場合は、エラーではなく何も取得できなかったとする。
      // 例えば`user:foo`のクエリをなげて、fooユーザが一つもリポジトリを持っていないと422が返ってくる。
      if (statusCode === 422) {
        return {issues: [], totalCount: 0, githubHeader};
      }

      return {error};
    }

    // v4 apiによってinjectされるが、デフォルト値を入れておく
    body.items.forEach(item => {
      item.private = item.private ?? false;
      item.draft = item.draft ?? false;
      item.involves = item.involves ?? [];
      item.requested_reviewers = item.requested_reviewers ?? [];
      item.last_timeline_user = '';
      item.last_timeline_at = '';
      item.projectFields = [];
    });

    return {issues: body.items, totalCount: body.total_count, githubHeader};
  }
}
