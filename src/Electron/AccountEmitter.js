import events from 'events';

const EVENT_NAMES = {
  OPEN_ACCOUNT_SETTING: 'open_account_setting',
  CLOSE_ACCOUNT_SETTING: 'close_account_setting',
  CREATE_ACCOUNT: 'create_account',
  REWRITE_ACCOUNT: 'rewrite_account'
};

/**
 * `account` = `config.github` = `{accessToken, host, https, interval, pathPrefix, webHost}`
 */
export class AccountEmitter {
  constructor() {
    this._eventEmitter = new events.EventEmitter();
    this._callbacks = {};
    this._callbackId = 0;
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

  // open setting
  emitOpenAccountSetting(index, account) {
    this._eventEmitter.emit(EVENT_NAMES.OPEN_ACCOUNT_SETTING, index, account);
  }

  addOpenAccountSettingListener(callback) {
    return this._addListener(EVENT_NAMES.OPEN_ACCOUNT_SETTING, callback);
  }

  // close setting
  emitCloseAccountSetting(index, account) {
    this._eventEmitter.emit(EVENT_NAMES.CLOSE_ACCOUNT_SETTING, index, account);
  }

  addCloseAccountSettingListener(callback) {
    return this._addListener(EVENT_NAMES.CLOSE_ACCOUNT_SETTING, callback);
  }

  // create account
  emitCreateAccount(account) {
    this._eventEmitter.emit(EVENT_NAMES.CREATE_ACCOUNT, account);
  }

  addCreateAccountListener(callback) {
    return this._addListener(EVENT_NAMES.CREATE_ACCOUNT, callback);
  }

  // rewrite account
  emitRewriteAccount(index, account) {
    this._eventEmitter.emit(EVENT_NAMES.REWRITE_ACCOUNT, index, account);
  }

  addRewriteAccountListener(callback) {
    return this._addListener(EVENT_NAMES.REWRITE_ACCOUNT, callback);
  }
}

export default new AccountEmitter();
