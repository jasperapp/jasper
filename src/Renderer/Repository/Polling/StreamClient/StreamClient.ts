import {GitHubSearchClient} from '../../GitHub/GitHubSearchClient';
import {DateUtil} from '../../../Util/DateUtil';
import {TimerUtil} from '../../../Util/TimerUtil';
import {IssueRepo} from '../../IssueRepo';
import {StreamRepo} from '../../StreamRepo';
import {SystemStreamRepo} from '../../SystemStreamRepo';
import {StreamEvent} from '../../../Event/StreamEvent';
import {GitHubClient} from '../../GitHub/GitHubClient';
import {UserPrefRepo} from '../../UserPrefRepo';
import {DB} from '../../../Infra/DB';
import {IssueEntity} from '../../../Type/IssueEntity';

const PerPage = 100;
const MaxSearchingCount = 1000;
const MaxSearchingCountAtFirst = PerPage;

export class StreamClient {
  private readonly id: number;
  private readonly name: string;
  private queries: string[];
  private queryIndex: number = 0;
  private searchedAt: string;
  private nextSearchedAt: string;
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

    // 次の実行時に使う時刻
    if (this.queryIndex === 0 && this.page === 1) {
      this.nextSearchedAt = DateUtil.localToUTCString(new Date());
    }


    // 初回はデータを取りすぎないようにする
    const maxSearchingCount = this.searchedAt ? MaxSearchingCount : MaxSearchingCountAtFirst;

    // search
    const {error, finishAll} = await this.search(queries, maxSearchingCount);
    if (error) {
      console.error(error);
      this.hasError = true;
      return;
    }

    // すべて取得して一周したときにsearchedAtを更新する
    if (finishAll) {
      let res;
      if (this.id > 0) { // todo: fix hack
        res = await StreamRepo.updateSearchedAt(this.id, this.searchedAt);
      } else {
        res = await SystemStreamRepo.updateSearchedAt(this.id, this.searchedAt);
      }
      if (res.error) {
        console.error(res.error);
        this.hasError = true;
        return;
      }
    }
    this.searchedAt = this.nextSearchedAt;
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

  private async search(queries: string[], maxSearchingCount: number): Promise<{finishAll?: boolean; error?: Error}> {
    const query = queries[this.queryIndex];
    const github = UserPrefRepo.getPref().github;
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
          const res = await DB.selectSingle<IssueEntity>('select * from issues where id = ?', [issue.id]);
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

    StreamEvent.emitUpdateStreamIssues(this.id, updatedIssueIds);

    const searchingCount = this.page * PerPage;
    if (searchingCount < maxSearchingCount && searchingCount < body.total_count) {
      this.page++;
    } else {
      this.page = 1;
      this.queryIndex = (this.queryIndex + 1) % queries.length;
    }

    // 最初のpageに戻りかつ最初のqueryになった場合、全て読み込んだとする
    const finishAll = this.page === 1 && this.queryIndex === 0;
    return {finishAll};
  }
}
