import {TimerUtil} from '../../Library/Util/TimerUtil';
import dayjs from 'dayjs';
import {DateEvent} from '../../Event/DateEvent';

class _DatePolling {
  private execId: number;
  private prev = dayjs().format('YYYY-MM-DD');

  start() {
    this.exec();
  }

  stop() {
    this.execId = null;
  }

  private async exec() {
    const execId = this.execId = Date.now();

    while(1) {
      if (!this.execId) return;
      if (this.execId !== execId) return;

      const now = dayjs().format('YYYY-MM-DD');
      console.log(this.prev, now)
      if (this.prev !== now) {
        this.prev = now;
        DateEvent.emitChangingDate();
        console.log('changing date')
      }

      await TimerUtil.sleep(60 * 1000);
    }
  }
}

export const DatePolling = new _DatePolling();
