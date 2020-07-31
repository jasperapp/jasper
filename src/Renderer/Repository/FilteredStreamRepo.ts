import {DBIPC} from '../../IPC/DBIPC';
import {DateUtil} from '../Util/DateUtil';
import {StreamEntity} from '../Type/StreamEntity';

class _FilteredStreamRepo {
  async createFilteredStream(stream: StreamEntity, name: string, filter: string, notification: number, color: string) {
    const streamId = stream.id;
    const createdAt = DateUtil.localToUTCString(new Date());
    const position = stream.position;

    await DBIPC.exec(
      'insert into filtered_streams (stream_id, name, filter, notification, color, created_at, updated_at, position) values(?, ?, ?, ?, ?, ?, ?, ?)',
      [streamId, name, filter, notification, color, createdAt, createdAt, position]
    );
  }
}

export const FilteredStreamRepo = new _FilteredStreamRepo();
