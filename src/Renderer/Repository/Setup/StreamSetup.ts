import {UserPrefRepo} from '../UserPrefRepo';
import {GitHubSearchClient} from '../../Library/GitHub/GitHubSearchClient';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamId, StreamRepo} from '../StreamRepo';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {DB} from '../../Library/Infra/DB';
import {color} from '../../Library/Style/color';
import {GitHubUserClient} from '../../Library/GitHub/GitHubUserClient';
import {GitHubUtil} from '../../Library/Util/GitHubUtil';
import {RemoteUserTeamEntity} from '../../Library/Type/RemoteGitHubV3/RemoteUserTeamEntity';
import {ArrayUtil} from '../../Library/Util/ArrayUtil';
import {RemoteIssueEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {GitHubV4IssueClient} from '../../Library/GitHub/V4/GitHubV4IssueClient';

class _StreamSetup {
  private creatingInitialStreams: boolean = false;
  private involvesIssues: RemoteIssueEntity[];

  isCreatingInitialStreams(): boolean {
    return this.creatingInitialStreams;
  }

  async exec() {
    this.creatingInitialStreams = false;

    const already = await this.isAlready();
    if (already) return;

    this.involvesIssues = await this.fetchInvolvesIssues();
    // note: 並列には実行できない(streamのポジションがその時のレコードに依存するから)
    await this.createLibraryStreams();
    await this.createSystemStreams();
    await this.createMeStream();
    // await this.createTeamStream();
    // await this.createRepoStreams();
    this.creatingInitialStreams = true;
  }

  private async isAlready(): Promise<boolean> {
    const {error, streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream', 'ProjectStream']);
    if (error) return true;
    if (streams.length !== 0) return true;

    return false;
  }

  private async fetchInvolvesIssues(): Promise<RemoteIssueEntity[]> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const updatedAt = DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `involves:${UserPrefRepo.getUser().login} updated:>=${updatedAt}`;
    const {error, issues} = await client.search(query, 1, 100);
    if (error) {
      console.error(error);
      return [];
    }
    return issues;
  }

  private async createLibraryStreams() {
    const createdAt = DateUtil.localToUTCString(new Date());
    const type: StreamEntity['type'] = 'LibraryStream';
    const {error} = await DB.exec(`
      insert into
        streams (id, type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
      values
        (${StreamId.inbox},    "${type}", "Inbox",    null, "", "is:unarchived",             "", -1004, 0, "inbox-full",        "${color.stream.blue}", 1, "${createdAt}", "${createdAt}", ""),
        (${StreamId.unread},   "${type}", "Unread",   null, "", "is:unarchived is:unread",   "", -1003, 0, "clipboard-outline", "${color.stream.blue}", 0, "${createdAt}", "${createdAt}", ""),
        (${StreamId.open},     "${type}", "Open",     null, "", "is:unarchived is:open",     "", -1002, 0, "book-open-variant", "${color.stream.blue}", 0, "${createdAt}", "${createdAt}", ""),
        (${StreamId.mark},     "${type}", "Bookmark", null, "", "is:unarchived is:bookmark", "", -1001, 0, "bookmark",          "${color.stream.blue}", 1, "${createdAt}", "${createdAt}", ""),
        (${StreamId.archived}, "${type}", "Archived", null, "", "is:archived",               "", -1000, 0, "archive",           "${color.stream.blue}", 1, "${createdAt}", "${createdAt}", "")
    `);
    if (error) {
      console.error(error);
      return;
    }
  }

  private async createSystemStreams() {
    const createdAt = DateUtil.localToUTCString(new Date());
    const type: StreamEntity['type'] = 'SystemStream';
    const {error} = await DB.exec(`
      insert into
        streams (id, type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
      values
        (${StreamId.team},         "${type}", "Team",         ${StreamId.team},         "", "is:unarchived", "", -102, 1, "account-multiple", "${color.brand}", 0, "${createdAt}", "${createdAt}", ""),
        (${StreamId.watching},     "${type}", "Watching",     ${StreamId.watching},     "", "is:unarchived", "", -101, 1, "eye",              "${color.brand}", 0, "${createdAt}", "${createdAt}", ""),
        (${StreamId.subscription}, "${type}", "Subscription", ${StreamId.subscription}, "", "is:unarchived", "", -100, 1, "volume-high",      "${color.brand}", 0, "${createdAt}", "${createdAt}", "")
    `);
    if (error) {
      console.error(error);
      return;
    }
  }

  private async createMeStream() {
    // create stream
    const iconColor = color.brand;
    const queries = [`involves:${UserPrefRepo.getUser().login}`, `user:${UserPrefRepo.getUser().login}`];
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Me', queries, [], 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    const login = UserPrefRepo.getUser().login;
    await StreamRepo.createStream('FilterStream', stream.id, 'My Issues', [], [`is:issue author:${login}`], 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'My PRs', [], [`is:pr author:${login}`], 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'Assign', [], [`assignee:${login}`], 1, iconColor);
  }

  private async createTeamStream() {
    const teams = await this.getUsingTeams();
    if (!teams.length) return;

    // create stream
    const iconColor = color.stream.navy;
    const query = teams.map(team => `team:${team.organization.login}/${team.slug}`).join(' ');
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Team', [query], [], 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    for (const team of teams) {
      await StreamRepo.createStream('FilterStream', stream.id, `@${team.organization.login}/${team.slug}`, [], [`team:${team.organization.login}/${team.slug}`], 1, iconColor);
    }
  }

  // 使用しているteamを取得する
  // 1. 所属するチームを全て取得
  // 2. 自分が関係したissueのorgのチームにだけ限定する(チームが多い場合、不要なチームをふるいにかけるため)
  // 3. チームとinvolves:meでissueを検索する
  //   - チームが多い場合は最新のチームでも検索する
  // 4. teamメンションを取得できるようにv4 issueをマージする
  // 5. teamメンションされたissueが多い順にtop3のteamを返す
  private async getUsingTeams(): Promise<RemoteUserTeamEntity[]> {
    // fetch teams
    const github = UserPrefRepo.getPref().github;
    const userClient = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error: e1, teams: allTeams} = await userClient.getUserTeams(1, 1);
    if (e1) {
      console.error(e1);
      return [];
    }
    if (!allTeams.length) return [];

    // 自分が関係したorgのみのteamに絞る
    // 理由: teamがたくさんある場合、最適なチームを選ぶ可能性をあげるため
    const orgs = this.involvesIssues.map(issue => {
      const {repoOrg} = GitHubUtil.getInfo(issue.url);
      return repoOrg;
    });
    const teams = allTeams.filter(team => orgs.includes(team.organization.login));
    if (!teams.length) return [];

    // search
    const involves = `involves:${UserPrefRepo.getUser().login}`;
    const updatedAt = `updated:>=${DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))}`; // 30days ago
    const maxLength = 256 - involves.length - 1 - updatedAt.length - 1;
    const teamWords = teams.map(t => `team:${t.organization.login}/${t.slug}`);
    const teamQueries = ArrayUtil.joinWithMax(teamWords, maxLength);
    const query = `${teamQueries[0]} ${involves} ${updatedAt}`;
    const searchClient = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error: e2, issues} = await searchClient.search(query, 1, 100);
    if (e2) {
      console.error(e2);
      return [];
    }

    // teams数が多い場合、最新の方でも検索する
    // 理由: 最古だけだと、古いissueしか取れない場合があるから
    if (teamQueries.length >= 2) {
      const rTeamWords = [...teamWords].reverse();
      const teamQueries = ArrayUtil.joinWithMax(rTeamWords, maxLength);
      const query = `${teamQueries[0]} ${involves} ${updatedAt}`;
      const {error, issues: issues2} = await searchClient.search(query, 1, 100);
      if (error) {
        console.error(error);
        return [];
      }

      // 最新と最古で検索した場合、teamが重複する可能性があるので、issueも重複する可能性がある。
      // なので、重複しないものだけ追加する
      issues2.forEach(issue2 => {
        if (!issues.find(issue => issue.id === issue2.id)) issues.push(issue2);
      });
    }
    if (!issues.length) return [];

    // v4も取得して、teamメンションを取れるようにする
    {
      const v4Client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
      const {error, issues: v4Issues} = await v4Client.getIssuesByNodeIds(issues);
      if (error) {
        console.error(error);
        return [];
      }
      GitHubV4IssueClient.injectV4ToV3(v4Issues, issues);
    }

    // count and sort
    const teamCounts: {team: RemoteUserTeamEntity, count: number}[] = [];
    for (const team of teams) {
      // todo: team.slugじゃなくてteam.nameが適切?
      const teamName = `${team.organization.login}/${team.slug}`;
      const count = issues.filter(issue => {
        return issue.mentions.find(mention => mention.login === teamName)
      }).length;
      teamCounts.push({team, count});
    }
    teamCounts.sort((a, b) => b.count - a.count);

    return teamCounts.filter(teamCount => teamCount.count).slice(0, 3).map(v => v.team);
  }

  private async createRepoStreams() {
    // create stream
    const iconColor = color.stream.green;
    const repos = await this.getUsingRepos();
    const query = repos.map(repo => `repo:${repo}`).join(' ');
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Repo', [query], [], 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    for (const repo of repos) {
      const shortName = repo.split('/')[1];
      await StreamRepo.createStream('FilterStream', stream.id, `${shortName}`, [], [`repo:${repo}`], 1, iconColor);
    }
  }

  private async getUsingRepos(): Promise<string[]> {
    const issues = [...this.involvesIssues];
    if (!issues.length) return [];

    const repoCounts = {};
    for (const issue of issues) {
      const paths = issue.url.split('/').reverse();
      const repo = `${paths[3]}/${paths[2]}`;
      if (!repoCounts[repo]) repoCounts[repo] = 0;
      repoCounts[repo]++;
    }

    const items = Object.keys(repoCounts).map(repo => ({repo: repo, count: repoCounts[repo]}));
    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 3).map(item => item.repo);
  }
}

export const StreamSetup = new _StreamSetup();
