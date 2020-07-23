import Logger from 'color-logger';
import {Config} from '../Config';
import {Timer} from '../../Util/Timer';
import {DateConverter} from '../../Util/DateConverter';
import {GitHubSearchClient} from '../GitHub/GitHubSearchClient';
import {IssuesRepo as Issues} from '../Repository/IssuesRepo';
import {StreamsTable} from '../DB/StreamsTable';
import {SystemStreamsTable} from '../DB/SystemStreamsTable';
import {StreamsIssuesTable as StreamsIssues} from '../DB/StreamsIssuesTable';
import {StreamEmitter} from './StreamEmitter';
import {GitHubClient} from '../GitHub/GitHubClient';
import {DB} from '../DB/DB';

export class Stream {
  private readonly _id: number;
  private readonly _name: string;
  private _queries: string[];
  private _running: boolean;
  private _searchedAt: string;
  private _client: GitHubClient;

  constructor(id, name, queries, searchedAt) {
    this._id = id;
    this._name = name;
    this._queries = queries;
    this._running = false;
    this._searchedAt = searchedAt;
    this._client = null;
  }

  get id() {
    return this._id;
  }

  start(firstImmediate = false) {
    if (!this._running) this._run(firstImmediate);
  }

  stop() {
    this._running = false;
    this._client.cancel();
  }

  getQueries() {
    return [].concat(this._queries);
  }

  async _buildQueries() {
    return this._queries;
  }

  async _filter(issues) {
    return issues;
  }

  async _run(firstImmediate) {
    this._running = true;
    let immediate = firstImmediate;
    const client = this._client = new GitHubSearchClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const page = 1;
    const perPage = 100;
    const MAX_SEARCHING_COUNT = 1000;

    while(1) {
      if (!this._running) break;

      // for next search
      const searchedAt = DateConverter.localToUTCString(new Date());

      // build query
      this._queries = await this._buildQueries();
      if (!this._queries.length) {
        await Timer.sleep(600 * 1000);
        continue;
      }
      const queries = this._queries.map((query)=>{
        if (this._searchedAt) {
          return `${query} updated:>=${this._searchedAt}`;
        } else {
          return query;
        }
      });

      let maxSearchingCount;

      // if current issues is empty, this stream is first fetching.
      const currentIssuesCount = await StreamsIssues.totalCount(this._id);
      if (currentIssuesCount === 0) {
        // todo: worried about maxSearchingCount when first fetching
        maxSearchingCount = perPage; // only 1 page when first fetching
        // maxSearchingCount = MAX_SEARCHING_COUNT;
      } else {
        maxSearchingCount = MAX_SEARCHING_COUNT;
      }

      // search
      try {
        await this._searchAll(client, queries, immediate, page, perPage, maxSearchingCount);
        if (!this._running) break;
      } catch (e) {
        Logger.e(e.stack);
        Logger.e(e.toString());
        continue;
      }

      immediate = false;

      // update searched_at
      this._searchedAt = searchedAt;
      if (this._id > 0) { // hack:
        await StreamsTable.updateSearchedAt(this._id, searchedAt);
      } else {
        await SystemStreamsTable.updateSearchedAt(this._id, this._searchedAt);
      }
    }
  }

  async _searchAll(client, queries, immediate, page, perPage, maxSearchingCount) {
    const promises = queries.map((query) => {
      return this._search(client, query, immediate, page, perPage, maxSearchingCount);
    });

    await Promise.all(promises);
  }

  async _search(client, query, immediate, page, perPage, maxSearchingCount) {
    let response;
    if (immediate) {
      response = await client.requestImmediate(query, page, perPage);
    } else {
      response = await client.request(query, page, perPage);
    }
    if (!this._running) return;

    const issues = await this._filter(response.body.items);
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
    if (Config.host !== 'api.github.com') {
      const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
      for (const issue of issues) {
        // if (this._searchedAt > issue.updated_at) issue.updated_at = this._searchedAt;
        if (this._searchedAt > issue.updated_at && issue.pull_request) {
          // APIの通信回数を抑えるために、未読の場合は現在のupdated_atを採用する
          // 実質これでも問題はないはずである
          const currentIssue = await DB.selectSingle('select * from issues where id = ?', [issue.id]);
          if (currentIssue && currentIssue.updated_at > currentIssue.read_at) {
            issue.updated_at = currentIssue.updated_at;
            continue;
          }

          const tmp = issue.pull_request.url.split('/').reverse();
          const pathName = `/repos/${tmp[3]}/${tmp[2]}/pulls/${tmp[0]}`;
          try {
            const response = await client.requestImmediate(pathName);
            if (response) issue.updated_at = response.body.updated_at;
          } catch (e) {
            Logger.e(e.stack);
            Logger.e(e.toString());
          }

          await Timer.sleep(1000);
        }
      }
    }

    const updatedIssueIds = await Issues.import(issues);
    await StreamsIssues.import(this._id, issues);
    Logger.n(`[updated] stream: ${this._id}, name: ${this._name}, page: ${page}, totalCount: ${response.body.total_count}, updatedIssues: ${updatedIssueIds.length}`);

    StreamEmitter.emitUpdateStream(this._id, updatedIssueIds);

    const searchingCount = page * perPage;
    if (searchingCount < maxSearchingCount && searchingCount < response.body.total_count) {
      await this._search(client, query, false, page + 1, perPage, maxSearchingCount);
    }
  }
}
