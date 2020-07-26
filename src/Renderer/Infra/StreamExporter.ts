import {DateConverter} from '../../Util/DateConverter';
import {DBIPC} from '../../IPC/DBIPC';

class _StreamExporter {
  async export(): Promise<{streamSettings: any[]}> {
    const streamSettings = [];
    const {rows: streams} = await DBIPC.select('select * from streams order by position');
    const {rows: filters} = await DBIPC.select('select * from filtered_streams order by stream_id, position');

    for (const stream of streams) {
      const _filters = filters.filter(v => v.stream_id === stream.id);
      streamSettings.push({stream, filters: _filters});
    }

    return {streamSettings};
  }

  async import(streamSettings) {
    const res1 = await DBIPC.selectSingle('select max(id) + 1 as id, count(1) as count from streams');
    let {id: streamIndex, count: streamCount} = res1.row;
    streamIndex = streamIndex || 1;

    const res2 = await DBIPC.selectSingle('select max(id) + 1 as id, count(1) as count from filtered_streams');
    let {id: filterIndex, count: filterCount} = res2.row;
    filterIndex = filterIndex || 1;

    let position = streamCount + filterCount;
    const now = DateConverter.localToUTCString(new Date());

    for (const {stream, filters} of streamSettings) {
      await DBIPC.exec(`
        insert
          into streams
            (id, name, queries, position, notification, color, created_at, updated_at)
          values
            (?, ?, ?, ?, ?, ?, ?, ?)
        `, [streamIndex, stream.name, stream.queries, position, stream.notification, stream.color, now, now]);
      position++;

      for (const filter of filters) {
        await DBIPC.exec(`
          insert
            into filtered_streams
              (id, stream_id, name, filter, notification, color, position, created_at, updated_at)
            values
              (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [filterIndex, streamIndex, filter.name, filter.filter, filter.notification, filter.color, position, now, now]);
        filterIndex++;
        position++;
      }

      streamIndex++;
    }
  }
}

export const StreamExporter = new _StreamExporter();
