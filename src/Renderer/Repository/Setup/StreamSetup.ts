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

class _StreamSetup {
  private creatingInitialStreams: boolean = false;

  isCreatingInitialStreams(): boolean {
    return this.creatingInitialStreams;
  }

  async exec() {
    const already = await this.isAlready();
    if (already) return;

    // note: 並列には実行できない(streamのポジションがその時のレコードに依存するから)
    await this.createLibraryStreams();
    await this.createSystemStreams();
    await this.createMeStream();
    await this.createTeamStream();
    await this.createRepoStreams();
    this.creatingInitialStreams = true;
  }

  private async isAlready(): Promise<boolean> {
    const {error, streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream', 'ProjectStream']);
    if (error) return true;
    if (streams.length !== 0) return true;

    return false;
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
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Me', queries, '', 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    const login = UserPrefRepo.getUser().login;
    await StreamRepo.createStream('FilterStream', stream.id, 'My Issues', [], `is:issue author:${login}`, 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'My PRs', [], `is:pr author:${login}`, 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'Assign', [], `assignee:${login}`, 1, iconColor);
  }

  private async createTeamStream() {
    const teams = await this.getUsingTeams();
    if (!teams.length) return;

    // create stream
    const iconColor = color.stream.navy;
    const query = teams.map(team => `team:${team.organization.login}/${team.slug}`).join(' ');
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Team', [query], '', 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    for (const team of teams) {
      await StreamRepo.createStream('FilterStream', stream.id, team.organization.login, [], `org:${team.organization.login}`, 1, iconColor);
    }
  }

  private async getUsingTeams(): Promise<RemoteUserTeamEntity[]> {
    // fetch teams
    const github = UserPrefRepo.getPref().github;
    const userClient = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error: e1, teams} = await userClient.getUserTeams(1, 1);
    if (e1) {
      console.error(e1);
      return [];
    }
    if (!teams.length) return [];

    // search
    const teamQueries = ArrayUtil.joinWithMax(teams.map(t => `team:${t.organization.login}/${t.slug}`), 256);
    const updatedAt = DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `${teamQueries[0]} updated:>=${updatedAt}`;
    const searchClient = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const {error: e2, issues} = await searchClient.search(query, 1, 100);
    if (e2) {
      console.error(e2);
      return [];
    }

    // teams数が多い場合、最新の方でも検索する
    // 理由: 最古(teamQueries[0])だけだと、古いissueしか取れない場合があるので。
    if (teamQueries.length >= 2) {
      const query = `${teamQueries[teamQueries.length - 1]} updated:>=${updatedAt}`;
      const {error, issues: issues2} = await searchClient.search(query, 1, 100);
      if (error) {
        console.error(error);
        return [];
      }
      issues.push(...issues2);
    }

    if (!issues.length) return [];

    // count
    const orgCounts = {};
    for (const issue of issues) {
      const {repoOrg} = GitHubUtil.getInfo(issue.url);
      if (!orgCounts[repoOrg]) orgCounts[repoOrg] = 0;
      orgCounts[repoOrg]++;
    }

    // sort
    const items = Object.keys(orgCounts).map(org => {
      const team = teams.find(team => team.organization.login === org);
      return {team, count: orgCounts[org]};
    });
    items.sort((a, b) => b.count - a.count);
    return items.filter(item => item.team).slice(0, 3).map(item => item.team);
  }

  private async createRepoStreams() {
    // create stream
    const iconColor = color.stream.green;
    const repos = await this.getUsingRepos();
    const query = repos.map(repo => `repo:${repo}`).join(' ');
    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Repo', [query], '', 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    for (const repo of repos) {
      const shortName = repo.split('/')[1];
      await StreamRepo.createStream('FilterStream', stream.id, `${shortName}`, [], `repo:${repo}`, 1, iconColor);
    }
  }

  private async getUsingRepos(): Promise<string[]> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
    const updatedAt = DateUtil.localToUTCString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30days ago
    const query = `involves:${UserPrefRepo.getUser().login} updated:>=${updatedAt}`;
    const {error, issues} = await client.search(query, 1, 100);
    if (error) {
      console.error(error);
      return [];
    }

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
