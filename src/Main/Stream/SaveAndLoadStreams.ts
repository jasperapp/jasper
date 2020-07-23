import {DB} from '../DB/DB';
import {StreamEmitter} from './StreamEmitter';
import {DateConverter} from '../../Util/DateConverter';

class _SaveAndLoadStreams {
  async save() {
    const output = [];
    const streams = await DB.select('select * from streams order by position');
    const filters = await DB.select('select * from filtered_streams order by stream_id, position');

    for (const stream of streams) {
      const _filters = filters.filter(v => v.stream_id === stream.id);
      output.push({stream, filters: _filters});
    }

    return output;
  }

  async load(data) {
    let {id: streamIndex, count: streamCount} = await DB.selectSingle('select max(id) + 1 as id, count(1) as count from streams');
    let {id: filterIndex, count: filterCount} = await DB.selectSingle('select max(id) + 1 as id, count(1) as count from filtered_streams');
    let position = streamCount + filterCount;
    const now = DateConverter.localToUTCString(new Date());

    streamIndex = streamIndex || 1;
    filterIndex = filterIndex || 1;

    for (const {stream, filters} of data) {
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

    StreamEmitter.emitRestartAllStreams();
  }
}

export const SaveAndLoadStreams = new _SaveAndLoadStreams();
