import {Config} from '../Config';
import Timer from '../Util/Timer';
import Identifier from '../Util/Identifier';

type CallbackStruct = [
  () => void,
  (arg: any) => void,
  (e: any) => void,
  string
];

export class GitHubClientDeliver {
  private _callbacks: CallbackStruct[];
  private _running: string;

  private _immediateCallbacks: CallbackStruct[];
  private _immediateRunning: string;

  constructor() {
    this._callbacks = [];
    this._immediateCallbacks = [];
    this._run();
  }

  push(callback, name = null) {
    return new Promise((resolve, reject)=>{
      this._callbacks.push([callback, resolve, reject, name]);
      if (!this._running) this._run();
    });
  }

  pushImmediate(callback, name = null) {
    return new Promise((resolve, reject)=>{
      this._immediateCallbacks.push([callback, resolve, reject, name]);
      if (!this._immediateRunning) this._immediateRun();
    });
  }

  stop() {
    this._running = null;
  }

  stopImmediate() {
    this._immediateRunning = null;
  }

  cancel(name) {
    const callbacks = this._callbacks.filter((item)=> item[3] !== name);
    this._callbacks.length = 0;
    this._callbacks.push(...callbacks);
  }

  async _run() {
    const running = this._running = `running:${Identifier.getId()}`;
    const interval = Config.apiInterval * 1000;
    while(1) {
      if (running !== this._running) break;

      if (this._callbacks.length > 0) {
        const [callback, resolve, reject] = this._callbacks.shift();
        try {
          const result = await new Promise(callback);
          resolve(result);
        } catch (e) {
          reject(e);
        }
      }

      await Timer.sleep(interval);
    }
  }

  async _immediateRun() {
    const running = this._immediateRunning = `running:${Identifier.getId()}`;
    while(1) {
      if (running !== this._immediateRunning) break;
      if (!this._immediateCallbacks.length) break;

      const [callback, resolve, reject] = this._immediateCallbacks.shift();
      try {
        const result = await new Promise(callback);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    }

    this._immediateRunning = null;
  }
}

export default new GitHubClientDeliver()
