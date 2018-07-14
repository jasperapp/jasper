import events from 'events';
import Logger from 'color-logger';
import sqlite3 from 'sqlite3';
import Config from '../Config';

const EVENT_NAMES = {
  EXEC_DONE: 'exec_done'
};

export class DB {
  constructor() {
    this._sqlite = this._createSqlite();
    this._eventEmitter = new events.EventEmitter();
    this._callbacks = {};
    this._callbackId = 0;
  }

  _createSqlite() {
    // return new (sqlite3.verbose()).Database(Config.databasePath);
    return new sqlite3.Database(Config.databasePath);
  }

  reloadDBPath() {
    this._sqlite.close();
    this._sqlite = this._createSqlite();
  }

  exec(sql, params = null) {
    return new Promise((resolve, reject)=> {
      if (params) {
        this._sqlite.run(sql, ...params, (error, row)=> {
          error ? reject(error) : resolve(row);
          this.emitExecDone(sql, params);
        });
      } else {
        this._sqlite.run(sql, (error, row)=> {
          error ? reject(error) : resolve(row);
          this.emitExecDone(sql, params);
        });
      }
    });
  }

  select(sql, params = null, suppressSlowQueryLog = false) {
    const start = Date.now();
    return new Promise((resolve, reject)=>{
      if (params) {
        this._sqlite.all(sql, ...params, (error, row)=>{
          error ? reject(error) : resolve(row || []);

          const time = Date.now() - start;
          if (!suppressSlowQueryLog && time > 200) Logger.w('[slow query]', `${time}ms`, sql);
        });
      } else {
        this._sqlite.all(sql, (error, row)=>{
          error ? reject(error) : resolve(row || []);

          // slow query
          const time = Date.now() - start;
          if (!suppressSlowQueryLog && time > 200) Logger.w('[slow query]', `${time}ms`, sql);
        });
      }
    });
  }

  selectSingle(sql, params = null) {
    return new Promise((resolve, reject)=>{
      if (params) {
        this._sqlite.get(sql, ...params, (error, row)=>{
          error ? reject(error) : resolve(row);
        });
      } else {
        this._sqlite.get(sql, (error, row)=>{
          error ? reject(error) : resolve(row);
        });
      }
    });
  }

  _addListener(eventName, callback) {
    this._eventEmitter.addListener(eventName, callback);
    this._callbacks[this._callbackId] = callback;
    return this._callbackId++;
  }

  removeListeners(ids) {
    for (const id of ids) {
      const callback = this._callbacks[id];
      if (callback) this._eventEmitter.removeListener(EVENT_NAMES.SELECT_STREAM, callback);
      delete this._callbacks[id];
    }
  }

  emitExecDone(sql, params) {
    this._eventEmitter.emit(EVENT_NAMES.EXEC_DONE, sql, params);
  }

  addExecDoneListener(callback) {
    return this._addListener(EVENT_NAMES.EXEC_DONE, callback);
  }

  close() {
    return new Promise((resolve, reject)=>{
      this._sqlite.close((error)=> error ? reject(error) : resolve());
    });
  }
}

export default new DB();
