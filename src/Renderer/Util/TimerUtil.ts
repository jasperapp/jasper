class _Timer {
  sleep(milliSec) {
    return new Promise((resolve)=>{
      setTimeout(resolve, milliSec);
    });
  }
}

export const TimerUtil = new _Timer();
