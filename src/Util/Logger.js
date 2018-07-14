import moment from 'moment';

export class Logger {
  constructor() {
    this._logs = [];
  }

  _output(level, msg) {
    const time =  moment().format('YYYY-MM-DD HH:mm:ss');
    const log = `[${level}] [${time}] ${msg}`;
    console.log(log);

    this._logs.push(log);
    if (this._logs.length > 10000) {
      this._logs.shift();
    }
  }

  get all() {
    return [].concat(this._logs);
  }

  d(msg) {
    this._output('D', msg);
  }

  e(msg) {
    this._output('E', msg);
  }
}

export default new Logger();
