import {DBIPC} from '../../IPC/DBIPC';
import {DateConverter} from '../../Util/DateConverter';
import {StreamRow} from './StreamsRepo';

class _FilteredStreamRepo {
  async createFilteredStream(stream: StreamRow, name: string, filter: string, notification: number, color: string) {
    const streamId = stream.id;
    const createdAt = DateConverter.localToUTCString(new Date());
    const position = stream.position;

    await DBIPC.exec(
      'insert into filtered_streams (stream_id, name, filter, notification, color, created_at, updated_at, position) values(?, ?, ?, ?, ?, ?, ?, ?)',
      [streamId, name, filter, notification, color, createdAt, createdAt, position]
    );
  }
}

export const FilteredStreamRepo = new _FilteredStreamRepo();
