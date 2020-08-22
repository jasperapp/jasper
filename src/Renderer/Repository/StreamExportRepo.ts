import {DateUtil} from '../Util/DateUtil';
import {DB} from '../Infra/DB';
import {FilteredStreamEntity, StreamEntity} from '../Type/StreamEntity';

class _StreamExportRepo {
  async export(): Promise<{streamSettings: any[]}> {
    const streamSettings = [];
    const {error: error1, rows: streams} = await DB.select<StreamEntity>('select * from streams order by position');
    if (error1) {
      console.error(error1);
      return {streamSettings: []};
    }

    const {error: error2, rows: filters} = await DB.select<FilteredStreamEntity>('select * from filtered_streams order by stream_id, position');
    if (error2) {
      console.error(error2);
      return {streamSettings: []};
    }

    for (const stream of streams) {
      const _filters = filters.filter(v => v.stream_id === stream.id);
      streamSettings.push({stream, filters: _filters});
    }

    return {streamSettings};
  }

  async import(streamSettings) {
    const res1 = await DB.selectSingle<{id: number; count: number}>('select max(id) + 1 as id, count(1) as count from streams');
    if (res1.error) return console.error(res1.error);
    let {id: streamIndex, count: streamCount} = res1.row;
    streamIndex = streamIndex || 1;

    const res2 = await DB.selectSingle<{id: number; count: number}>('select max(id) + 1 as id, count(1) as count from filtered_streams');
    if (res2.error) return console.error(res2.error);
    let {id: filterIndex, count: filterCount} = res2.row;
    filterIndex = filterIndex || 1;

    let position = streamCount + filterCount;
    const now = DateUtil.localToUTCString(new Date());

    for (const {stream, filters} of streamSettings) {
      await DB.exec(`
        insert
          into streams
            (id, name, queries, position, notification, color, created_at, updated_at)
          values
            (?, ?, ?, ?, ?, ?, ?, ?)
        `, [streamIndex, stream.name, stream.queries, position, stream.notification, stream.color, now, now]);
      position++;

      for (const filter of filters) {
        await DB.exec(`
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

export const StreamExportRepo = new _StreamExportRepo();
