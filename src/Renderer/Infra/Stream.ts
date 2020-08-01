import {GitHubSearchClient} from './GitHubSearchClient';
import {DateUtil} from '../Util/DateUtil';
import {TimerUtil} from '../Util/TimerUtil';
import {DBIPC} from '../../IPC/DBIPC';
import {IssueRepo} from '../Repository/IssueRepo';
import {StreamRepo} from '../Repository/StreamRepo';
import {SystemStreamRepo} from '../Repository/SystemStreamRepo';
import {StreamEvent} from '../Event/StreamEvent';
import {GitHubClient} from './GitHubClient';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {ConfigRepo} from '../Repository/ConfigRepo';

const PerPage = 100;
const MaxSearchingCount = 1000;

export class Stream {
  private readonly id: number;
  private readonly name: string;
  private queries: string[];
  private queryIndex: number = 0;
  private searchedAt: string;
  private page: number = 1;
  private hasError: boolean = false;

  constructor(id, name, queries, searchedAt) {
    this.id = id;
    this.name = name;
    this.queries = queries;
    this.searchedAt = searchedAt;
  }

  async exec() {
    if (this.hasError) return;

    // build search query
    this.queries = await this.buildSearchQueries();
    if (!this.queries.length) return;
    const queries = this.queries.map(query =>{
      if (this.searchedAt) {
        return `${query} updated:>=${this.searchedAt}`;
      } else {
        return query;
      }
    });

    // 初回はデータを取りすぎないようにする
    const maxSearchingCount = this.searchedAt ? MaxSearchingCount : PerPage;

    // search
    const {error} = await this.search(queries, maxSearchingCount);
    if (error) {
      console.error(error);
      this.hasError = true;
      return;
    }

    // すべて取得したときにsearchedAtを更新する
    if (this.queryIndex === 0 && this.page === 1) {
      this.searchedAt = DateUtil.localToUTCString(new Date());
      if (this.id > 0) { // hack:
        const {error} = await StreamRepo.updateSearchedAt(this.id, this.searchedAt);
        if (error) {
          console.error(error);
          this.hasError = true;
          return;
        }
      } else {
        const {error} = await SystemStreamRepo.updateSearchedAt(this.id, this.searchedAt);
        if (error) {
          console.error(error);
          this.hasError = true;
          return;
        }
      }
    }
  }

  getId() {
    return this.id;
  }

  getQueries(): string[] {
    return [...this.queries];
  }

  protected async buildSearchQueries(): Promise<string[]> {
    return [...this.queries];
  }

  protected async filter(issues: any[]): Promise<any[]> {
    return issues;
  }

  private async search(queries: string[], maxSearchingCount: number): Promise<{error?: Error}> {
    const query = queries[this.queryIndex];
    const github = ConfigRepo.getConfig().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {body, error} = await client.search(query, this.page, PerPage);
    if (error) return {error};

    const issues = await this.filter(body.items);
    // hack: 検索条件に`updated:>={DATE}`を入れているので、取得したissue.updated_atは全てそれより新しいはずである。
    // しかし、現在(2017-01-08)、とある場合にissue.updated_atが正しくない。
    // それは「PRに対しての最後のコメントがreview commentやapprove」の場合である。
    // この場合、issue.updated_atが正しく更新されていない。
    // 予想だが、github内部ではPRに対して、２つのupdated_atがあると思われる。
    // 1つはissueとしてのupdated_at、もう1つはPRとしてのupdated_at
    // 前者はapproveやreview commentでは更新されず、後者はされる
    // 検索時は後者が条件として使われるが、レスポンスには前者が使われる
    // githubに問い合わせ中だが直るかどうかはわからないので、このhackを入れておく。
    //
    // 2017-05-06追記: どうやらこの問題はgithub.comでは直っているようだ。しかし、社内のGHEでは問題は残っている
    // というわけで、github.com以外の場合は以下のコードを使うことにする。
    // todo: いずれ削除したい
    if (github.host !== 'api.github.com') {
      const client = new GitHubClient(github.accessToken, github.host, github.pathPrefix, github.https);
      for (const issue of issues) {
        // if (this._searchedAt > issue.updated_at) issue.updated_at = this._searchedAt;
        if (this.searchedAt > issue.updated_at && issue.pull_request) {
          // APIの通信回数を抑えるために、未読の場合は現在のupdated_atを採用する
          // 実質これでも問題はないはずである
          const res = await DBIPC.selectSingle('select * from issues where id = ?', [issue.id]);
          const currentIssue = res.row;
          if (currentIssue && currentIssue.updated_at > currentIssue.read_at) {
            issue.updated_at = currentIssue.updated_at;
            continue;
          }

          const tmp = issue.pull_request.url.split('/').reverse();
          const pathName = `/repos/${tmp[3]}/${tmp[2]}/pulls/${tmp[0]}`;
          try {
            const response = await client.request(pathName);
            if (response?.body) issue.updated_at = response.body.updated_at;
          } catch (e) {
            console.error(e.stack);
            console.error(e.toString());
          }

          await TimerUtil.sleep(1000);
        }
      }
    }

    const {error: e1, updatedIssueIds} = await IssueRepo.createBulk(this.id, issues);
    if (e1) return {error: e1};

    if (updatedIssueIds.length) {
      console.log(`[updated] stream: ${this.id}, name: ${this.name}, page: ${this.page}, totalCount: ${body.total_count}, updatedIssues: ${updatedIssueIds.length}`);
    }

    if (this.id >= 0) {
      StreamEvent.emitUpdateStream(this.id, updatedIssueIds);
    } else {
      SystemStreamEvent.emitUpdateStream(this.id, updatedIssueIds);
    }

    const searchingCount = this.page * PerPage;
    if (searchingCount < maxSearchingCount && searchingCount < body.total_count) {
      this.page++;
    } else {
      this.page = 1;
      this.queryIndex = (this.queryIndex + 1) % queries.length;
    }

    return {};
  }
}
