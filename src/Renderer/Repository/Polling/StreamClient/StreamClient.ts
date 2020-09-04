import {GitHubSearchClient} from '../../../Library/GitHub/GitHubSearchClient';
import {DateUtil} from '../../../Library/Util/DateUtil';
import {IssueRepo} from '../../IssueRepo';
import {StreamEvent} from '../../../Event/StreamEvent';
import {UserPrefRepo} from '../../UserPrefRepo';
import {StreamRepo} from '../../StreamRepo';
import {GitHubIssueClient} from '../../../Library/GitHub/GitHubIssueClient';
import {RemoteIssueEntity} from '../../../Library/Type/RemoteIssueEntity';
import {GitHubV4Client} from '../../../Library/GitHub/V4/GitHubV4Client';
import {RemoteGitHubV4ViewerEntity} from '../../../Library/Type/RemoteGitHubV4/RemoteGitHubV4ViewerEntity';

const PerPage = 100;
const MaxSearchingCount = 1000;
const MaxSearchingCountAtFirst = PerPage;

export class StreamClient {
  private readonly id: number;
  private readonly name: string;
  private isFirstSearching: boolean;
  private queries: string[];
  private queryIndex: number = 0;
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
    const maxSearchingCount = this.isFirstSearching ? MaxSearchingCountAtFirst : MaxSearchingCount;

    // search
    const {error, finishAll} = await this.search(queries, maxSearchingCount);
    if (error) {
      console.error(error);
      this.hasError = true;
      return;
    }

    // すべて取得して一周したときにsearchedAtを更新する
    if (finishAll) {
      const {error} = await StreamRepo.updateSearchedAt(this.id, this.searchedAt);
      if (error) {
        console.error(error);
        this.hasError = true;
        return;
      }
      this.searchedAt = this.nextSearchedAt;
      this.isFirstSearching = false;
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

  private async search(queries: string[], maxSearchingCount: number): Promise<{finishAll?: boolean; error?: Error}> {
    const query = queries[this.queryIndex];
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error, issues: allIssues, totalCount} = await client.search(query, this.page, PerPage);
    if (error) return {error};

    const issues = await this.filter(allIssues);
    // await this.correctUpdatedAt(issues);

    const {error: e2} = await this.injectV4Properties(issues);
    if (e2) return {error: e2};

    const {error: e1, updatedIssueIds, closedPRIds} = await IssueRepo.createBulk(this.id, issues);
    if (e1) return {error: e1};

    if (updatedIssueIds.length) {
      console.log(`[updated] stream: ${this.id}, name: ${this.name}, page: ${this.page}, totalCount: ${totalCount}, updatedIssues: ${updatedIssueIds.length}`);
    }

    if (closedPRIds.length) {
      await this.checkMergedPRs(closedPRIds);
    }

    StreamEvent.emitUpdateStreamIssues(this.id, updatedIssueIds);

    const searchingCount = this.page * PerPage;
    if (searchingCount < maxSearchingCount && searchingCount < totalCount) {
      this.page++;
    } else {
      this.page = 1;
      this.queryIndex = (this.queryIndex + 1) % queries.length;
    }

    // 最初のpageに戻りかつ最初のqueryになった場合、全て読み込んだとする
    const finishAll = this.page === 1 && this.queryIndex === 0;
    return {finishAll};
  }

  private async injectV4Properties(issues: RemoteIssueEntity[]): Promise<{error?: Error}> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubV4Client(github.accessToken, github.host, github.https);
    const {error, data} = await client.request<RemoteGitHubV4ViewerEntity>(`
    viewer {
      login
    }
    `);
    if (error) return {error};

    console.log(data.viewer);
    return {};
  }

  // クローズされたIssue(PR)を個別にリクエストして、マージされたかどうかをチェックする
  private async checkMergedPRs(closedPRIds: number[]) {
    if (!closedPRIds.length) return;

    const {error, issues} = await IssueRepo.getIssues(closedPRIds);
    if (error) return console.error(error);

    // issueをrepoNameでグルーピングする
    const repoNameMap: {[repoName: string]: number[]} = {};
    for (const issue of issues) {
      if (issue.type !== 'pr') continue;
      if (!issue.closed_at) continue;
      if (issue.merged_at) continue;

      if (!repoNameMap[issue.repo]) repoNameMap[issue.repo] = [];
      repoNameMap[issue.repo].push(issue.number);
    }

    // 最大10個までのリクエストとする
    const repoNames = Object.keys(repoNameMap).slice(0, 10);
    console.log(`check merged. repos(${repoNames.length}) = ${repoNames.join(', ')}`);

    // PRを取得する
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubIssueClient(github.accessToken, github.host, github.pathPrefix, github.https);
    for (const repoName of repoNames) {
      const prNumbers = repoNameMap[repoName];
      const {error, prs} = await client.getPRsInRepo(repoName, prNumbers);
      if (error) return console.error(error);

      // merged_atを更新する
      for (const pr of prs) {
        if (!pr.merged_at) continue;

        const issue = issues.find(issue => issue.repo === repoName && issue.number === pr.number);
        if (!issue) continue;

        const {error} = await IssueRepo.updateMerged(issue.id, pr.merged_at);
        if (error) return console.error(error);
        console.log(`update merged. issue = ${issue.repo}#${issue.number}, issue.id = ${issue.id}`);
      }
    }
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
