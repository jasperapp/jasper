import {DBIPC} from '../../IPC/DBIPC';
import {DateUtil} from '../Util/DateUtil';
import {StreamEntity} from '../Type/StreamEntity';
import {IssueRepo} from './IssueRepo';
import {FilteredStreamEntity} from '../Type/FilteredStreamEntity';

class _FilteredStreamRepo {
  private async relations(filteredStreams: FilteredStreamEntity[]) {
    await this.relationUnreadCount(filteredStreams);
  }

  private async relationUnreadCount(filteredStreams: FilteredStreamEntity[]) {
    const promises = [];
    for (const filteredStream of filteredStreams) {
      const streamId = filteredStream.stream_id;
      const filter = `is:unread ${filteredStream.filter}`; // hack
      promises.push(IssueRepo.findIssues(streamId, filter, -1));
    }
    const tmps = await Promise.all(promises);

    for (let i = 0; i < filteredStreams.length; i++) {
      const filteredStream = filteredStreams[i];
      filteredStream.unreadCount = tmps[i].totalCount;
    }
  }

  async getAllFilteredStreams(): Promise<{error?: Error; filteredStreams?: FilteredStreamEntity[]}> {
    const {error, rows: filteredStreams} = await DBIPC.select<FilteredStreamEntity>('select * from filtered_streams order by position');
    if (error) return {error};

    await this.relations(filteredStreams);
    return {filteredStreams};
  }

  async createFilteredStream(stream: StreamEntity, name: string, filter: string, notification: number, color: string) {
    const streamId = stream.id;
    const createdAt = DateUtil.localToUTCString(new Date());
    const position = stream.position;

    await DBIPC.exec(
      'insert into filtered_streams (stream_id, name, filter, notification, color, created_at, updated_at, position) values(?, ?, ?, ?, ?, ?, ?, ?)',
      [streamId, name, filter, notification, color, createdAt, createdAt, position]
    );
  }

  async deleteFilteredStream(filteredStreamId: number): Promise<{error?: Error}> {
    const {error} = await DBIPC.exec('delete from filtered_streams where id = ?', [filteredStreamId]);
    if (error) return {error};
    return {};
  }
}

export const FilteredStreamRepo = new _FilteredStreamRepo();
