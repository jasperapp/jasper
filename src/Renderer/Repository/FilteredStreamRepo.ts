import {DateUtil} from '../Library/Util/DateUtil';
import {StreamEntity} from '../Library/Type/StreamEntity';
import {IssueRepo} from './IssueRepo';
import {FilteredStreamEntity} from '../Library/Type/StreamEntity';
import {DB} from '../Library/Infra/DB';

type FilteredStreamRow = {
  id: number;
  name: string;
  stream_id: number;
  filter: string;
  notification: number;
  color: string;
  position: number;
}

class _FilteredStreamRepo {
  private async convert(filteredStreamRows: FilteredStreamRow[]): Promise<FilteredStreamEntity[]> {
    if (!filteredStreamRows.length) return [];

    const filteredStreams: FilteredStreamEntity[] = filteredStreamRows.map(row => {
      return {
        ...row,
        type: 'filteredStream',
        queryStreamId: row.stream_id,
        queries: '',
        iconName: 'file-tree',
        enabled: 1,
        defaultFilter: 'is:unarchived',
        searched_at: '',
        unreadCount: 0,
      }
    });

    await this.relationUnreadCount(filteredStreams);

    return filteredStreams;
  }

  private async relationUnreadCount(filteredStreams: FilteredStreamEntity[]) {
    const promises = filteredStreams.map(s => IssueRepo.getUnreadCountInStream(s.stream_id, s.defaultFilter, s.filter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    filteredStreams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  async getAllFilteredStreams(): Promise<{error?: Error; filteredStreams?: FilteredStreamEntity[]}> {
    const {error, rows} = await DB.select<FilteredStreamRow>('select * from filtered_streams order by position');
    if (error) return {error};

    const filteredStreams = await this.convert(rows);
    return {filteredStreams};
  }

  async createFilteredStream(stream: StreamEntity, name: string, filter: string, notification: number, color: string): Promise<{error?: Error; filteredStreamId?: number}> {
    const streamId = stream.id;
    const createdAt = DateUtil.localToUTCString(new Date());
    const position = stream.position;

    const {error, insertedId} = await DB.exec(
      'insert into filtered_streams (stream_id, name, filter, notification, color, created_at, updated_at, position) values(?, ?, ?, ?, ?, ?, ?, ?)',
      [streamId, name, filter, notification, color, createdAt, createdAt, position]
    );
    if (error) return {error};

    return {filteredStreamId: insertedId};
  }

  async updateFilteredStream(filteredStreamId: number, name: string, filter: string, notification: number, color: string): Promise<{error?: Error}> {
    const updatedAt = DateUtil.localToUTCString(new Date());

    const {error} = await DB.exec(
      'update filtered_streams set name = ?, filter = ?, notification = ?, color = ?, updated_at = ? where id = ?',
      [name, filter, notification, color, updatedAt, filteredStreamId]
    );
    if (error) return {error};

    return {};
  }

  async updatePositions(filteredStreams: FilteredStreamEntity[]): Promise<{error?: Error}> {
    const promises = [];
    for (const stream of filteredStreams) {
      const p = DB.exec('update filtered_streams set position = ? where id = ?', [stream.position, stream.id]);
      promises.push(p);
    }

    const results = await Promise.all(promises) as {error?: Error}[];
    const error = results.find(res => res.error)?.error;
    if (error) return {error};

    return {};
  }

  async deleteFilteredStream(filteredStreamId: number): Promise<{error?: Error}> {
    const {error} = await DB.exec('delete from filtered_streams where id = ?', [filteredStreamId]);
    if (error) return {error};
    return {};
  }
}

export const FilteredStreamRepo = new _FilteredStreamRepo();
