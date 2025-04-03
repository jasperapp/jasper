import {DB} from '../../Library/Infra/DB';
import {color} from '../../Library/Style/color';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamId, StreamRepo} from '../StreamRepo';
import {UserPrefRepo} from '../UserPrefRepo';

class _StreamSetup {
  private creatingInitialStreams: boolean = false;

  isCreatingInitialStreams(): boolean {
    return this.creatingInitialStreams;
  }

  async exec() {
    this.creatingInitialStreams = false;

    const already = await this.isAlready();
    if (already) return;

    // note: 並列には実行できない(streamのポジションがその時のレコードに依存するから)
    await this.createLibraryStreams();
    await this.createSystemStreams();
    await this.createMeStream();
    this.creatingInitialStreams = true;
  }

  private async isAlready(): Promise<boolean> {
    const {error, streams} = await StreamRepo.getAllStreams(['UserStream', 'FilterStream']);
    if (error) return true;
    if (streams.length !== 0) return true;

    return false;
  }

  private async createLibraryStreams() {
    const createdAt = DateUtil.localToUTCString(new Date());
    const type: StreamEntity['type'] = 'LibraryStream';
    const {error} = await DB.exec(`
      insert into
        streams (id, type, name, query_stream_id, queries, default_filter, user_filters, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
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
        streams (id, type, name, query_stream_id, queries, default_filter, user_filters, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
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
    const user = UserPrefRepo.getUser();
    const iconColor = color.brand;
    const queries = [`involves:${user.login}`];

    // ユーザが自分のリポジトリを持っている場合のみ`user:foo`のクエリを追加する。
    // リポジトリを持っていない状態で`user:foo`を実行するとエラーが返ってくるため。
    const repoCount = (user.public_repos ?? 0) + (user.total_private_repos ?? 0);
    if (repoCount > 0) queries.push(`user:${user.login}`);

    const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Me', queries, [], 1, iconColor);
    if (error) {
      console.error(error);
      return;
    }

    // create filter
    const login = UserPrefRepo.getUser().login;
    await StreamRepo.createStream('FilterStream', stream.id, 'My Issues', [], [`is:issue author:${login}`], 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'My PRs', [], [`is:pr author:${login}`], 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'Assigned', [], [`assignee:${login}`], 1, iconColor);
    await StreamRepo.createStream('FilterStream', stream.id, 'Review Requested', [], [`review-requested:${login}`, `reviewed-by:${login}`], 1, iconColor);
  }
}

export const StreamSetup = new _StreamSetup();
