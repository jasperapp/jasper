import {GitHubSearchClient} from '../../../Library/GitHub/GitHubSearchClient';
import {DateUtil} from '../../../Library/Util/DateUtil';
import {IssueRepo} from '../../IssueRepo';
import {StreamEvent} from '../../../Event/StreamEvent';
import {UserPrefRepo} from '../../UserPrefRepo';
import {StreamRepo} from '../../StreamRepo';
import {RemoteIssueEntity} from '../../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {GitHubV4IssueClient} from '../../../Library/GitHub/V4/GitHubV4IssueClient';
import {StreamIssueRepo} from '../../StreamIssueRepo';
import {RemoteGitHubHeaderEntity} from '../../../Library/Type/RemoteGitHubV3/RemoteGitHubHeaderEntity';

const PER_PAGE = 100;
const MAX_SEARCHING_COUNT = 1000;

export class StreamClient {
  private readonly id: number;
  private readonly name: string;
  private isFirstSearching: boolean;
  private queries: string[];
  private queryIndex: number = 0;
  private startedAt: string;
  private searchedAt: string;
  private nextSearchedAt: string;
  private page: number = 1;
  private hasError: boolean = false;

  constructor(id: number, name: string, queries: string[], searchedAt: string | null) {
    this.id = id;
    this.name = name;
    this.queries = queries;
    this.searchedAt = searchedAt;
    this.isFirstSearching = !searchedAt;
    this.startedAt = DateUtil.localToUTCString(new Date());
  }

  async exec(): Promise<{fulfillRateLimit?: boolean}> {
    if (this.hasError) return {};

    // build search query
    this.queries = await this.buildSearchQueries();

    // クエリがない場合、検索したとみなして終了する。
    // 例えばsubscription streamは有効になってすぐはクエリがないので、すぐに検索終わったとみなす
    if (!this.queries.length) {
      const {error} = await StreamRepo.updateSearchedAt(this.id, this.searchedAt || this.startedAt);
      if (error) {
        console.error(error);
        this.hasError = true;
        return {};
      }

      if (this.isFirstSearching) StreamEvent.emitFinishFirstSearching(this.id);
      return {};
    }

    // inject `updated:>=`
    const queries = this.queries.map(query =>{
      if (this.searchedAt && this.isUsingSearchedAt()) {
        return `${query} updated:>=${this.searchedAt}`;
      } else {
        return query;
      }
    });

    // 次の実行時に使う時刻
    if (this.queryIndex === 0 && this.page === 1) {
      this.nextSearchedAt = DateUtil.localToUTCString(new Date());
    }

    // 3クエリ以上の場合、1クエリあたりの検索数を抑える。
    // workaround: 2クエリの場合に抑えないのは`[involves:me, user:me]`のクエリの場合は最大数取得したいため
    // それと、大抵の場合2クエリ以下になると予想しているため、許容範囲とした。
    let maxSearchingCountPerQuery: number;
    if (this.queries.length >= 3) {
      maxSearchingCountPerQuery = Math.floor(MAX_SEARCHING_COUNT / this.queries.length);
    } else {
      maxSearchingCountPerQuery = MAX_SEARCHING_COUNT;
    }

    // search
    const {error, finishAll, githubHeader} = await this.search(queries, maxSearchingCountPerQuery);
    if (error) {
      console.error(error);
      this.hasError = true;
      return {};
    }

    // すべて取得してqueryを一周したときにsearchedAtを更新する
    if (finishAll) {
      // note: 初回読み込みのときはsearchedAtが無いので、stream開始時刻を入れることにする
      const {error} = await StreamRepo.updateSearchedAt(this.id, this.searchedAt || this.startedAt);
      if (error) {
        console.error(error);
        this.hasError = true;
        return {};
      }

      if (this.isFirstSearching) {
        StreamEvent.emitFinishFirstSearching(this.id);
      }

      this.searchedAt = this.nextSearchedAt;
      this.isFirstSearching = false;
    }

    return {fulfillRateLimit: githubHeader?.fulfillRateLimit};
  }

  getId() {
    return this.id;
  }

  getIsFirstSearching() {
    return this.isFirstSearching;
  }

  getQueries(): string[] {
    return [...this.queries];
  }

  protected async buildSearchQueries(): Promise<string[]> {
    return [...this.queries];
  }

  protected isUsingSearchedAt() {
    return true;
  }

  protected async filter(issues: any[]): Promise<any[]> {
    return issues;
  }

  private async search(queries: string[], maxSearchingCount: number): Promise<{finishAll?: boolean; error?: Error; githubHeader?: RemoteGitHubHeaderEntity}> {
    const query = queries[this.queryIndex];
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error, issues: allIssues, totalCount, githubHeader} = await client.search(query, this.page, PER_PAGE);
    if (error) return {error};

    // ローカルのissueより新しいものだけにする
    const {error: e0, targetIssues} = await this.targetIssues(allIssues);
    if (e0) return {error: e0};

    // sub-class filter
    const issues = await this.filter(targetIssues);

    // await this.correctUpdatedAt(issues);

    const {error: e2} = await this.injectV4Properties(issues, githubHeader.gheVersion);
    if (e2) return {error: e2};

    // 最初の検索のときはかなり過去にさかのぼって検索するため、更新が古いissueについては既読扱いとしてしまう
    const {error: e1, updatedIssueIds} = await IssueRepo.createBulk(this.id, issues, this.isFirstSearching);
    if (e1) return {error: e1};

    if (updatedIssueIds.length) {
      console.log(`[updated] stream: ${this.id}, name: ${this.name}, page: ${this.page}, totalCount: ${totalCount}, updatedIssues: ${updatedIssueIds.length}`);
    }

    StreamEvent.emitUpdateStreamIssues(this.id, updatedIssueIds);

    const searchingCount = this.page * PER_PAGE;
    if (searchingCount < maxSearchingCount && searchingCount < totalCount) {
      this.page++;
    } else {
      this.page = 1;
      this.queryIndex = (this.queryIndex + 1) % queries.length;
    }

    // 最初のpageに戻りかつ最初のqueryになった場合、全て読み込んだとする
    const finishAll = this.page === 1 && this.queryIndex === 0;
    return {finishAll, githubHeader};
  }

  // 以下の条件のどちらかを満たすものだけを対象とする(無駄なリクエストをしないため)
  // - まだこのstreamににもづいていない
  // - ローカルのissueより新しい
  private async targetIssues(issues: RemoteIssueEntity[]): Promise<{error?: Error; targetIssues?: RemoteIssueEntity[]}> {
    const issueIds = issues.map(issue => issue.id);

    const {error: e1, issues: currentIssues} = await IssueRepo.getIssues(issueIds);
    if (e1) return {error: e1};

    const {error: e2, issueIds: relationIssueIds} = await StreamIssueRepo.getIssueIds(this.id);
    if (e2) return {error: e2};

    const targetIssues =  issues.filter(issue => {
      // まだ紐付いていないということは新規ということ
      if (!relationIssueIds.includes(issue.id)) return true;

      // ローカルより新しいということは更新されたということ
      const currentIssue = currentIssues.find(currentIssue => currentIssue.id === issue.id);
      if (currentIssue && issue.updated_at > currentIssue.updated_at) {
        return true;
      }

      return false;
    });

    return {targetIssues};
  }

  // v3(REST)の結果に、v4(GraphQL)の結果を追加する
  private async injectV4Properties(issues: RemoteIssueEntity[], gheVersion: string): Promise<{error?: Error}> {
    if (!issues.length) return {};

    // get v4 issues
    const nodeIds = issues.map(issue => issue.node_id);
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, gheVersion);
    const {error, issues: v4Issues} = await client.getIssuesByNodeIds(nodeIds);
    if (error) return {error};

    // inject v4 to v3
    GitHubV4IssueClient.injectV4ToV3(v4Issues, issues);
    return {};
  }

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
  //
  // 2020-08-29追記: GHEでも直っていた
  // private async correctUpdatedAt(issues: RemoteIssueEntity[]) {
  //   if (!this.searchedAt) return;
  //
  //   const github = UserPrefRepo.getPref().github;
  //   if (github.host === 'api.github.com') return;
  //
  //   const prs = issues
  //     .filter(issue => issue.pull_request)
  //     .filter(pr => pr.updated_at < this.searchedAt);
  //
  //   const client = new GitHubIssueClient(github.accessToken, github.host, github.pathPrefix, github.https);
  //   for (const pr of prs) {
  //     // APIの通信回数を抑えるために、未読の場合は現在のupdated_atを採用する
  //     // 実質これでも問題はないはずである
  //     const {error, issue: currentIssue} = await IssueRepo.getIssue(pr.id);
  //     if (error) continue;
  //     if (currentIssue && !IssueRepo.isRead(currentIssue)) {
  //       pr.updated_at = currentIssue.updated_at;
  //       continue;
  //     }
  //
  //     const {repo, issueNumber} = GitHubUtil.getInfo(pr.pull_request.url);
  //     const response = await client.getPR(repo, issueNumber);
  //     if (response?.pr) pr.updated_at = response.pr.updated_at;
  //
  //     await TimerUtil.sleep(1000);
  //   }
  // }
}
