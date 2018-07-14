import electron from 'electron';
const DB = electron.remote.require('./DB/DB.js').default;

export class LibraryStreamCenter {
  async findAllStreams() {
    const promises = [];
    promises.push(this.findInboxStream());
    promises.push(this.findUnreadStream());
    promises.push(this.findOpenStream());
    promises.push(this.findMarkedStream());
    promises.push(this.findArchivedStream());

    return await Promise.all(promises);
  }

  async findInboxStream() {
    const result = await DB.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        ((read_at is null) or (updated_at > read_at))
        and archived_at is null
    `);
    return {name: 'Inbox', unreadCount: result.count};
  }

  async findUnreadStream() {
    const result = await DB.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        ((read_at is null) or (updated_at > read_at))
        and archived_at is null
    `);
    return {name: 'Unread', unreadCount: result.count};
  }

  async findMarkedStream() {
    const result = await DB.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        marked_at is not null
        and ((read_at is null) or (updated_at > read_at))
        and archived_at is null
    `);
    return {name: 'Marked', unreadCount: result.count};
  }

  async findOpenStream() {
    const result = await DB.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        closed_at is null
        and ((read_at is null) or (updated_at > read_at))
        and archived_at is null
    `);
    return {name: 'Open', unreadCount: result.count};
  }

  async findArchivedStream() {
    const result = await DB.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        archived_at is not null
        and ((read_at is null) or (updated_at > read_at))
    `);
    return {name: 'Archived', unreadCount: result.count};
  }
}

export default new LibraryStreamCenter();
