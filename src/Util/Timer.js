export class Timer {
  sleep(milliSec) {
    return new Promise((resolve)=>{
      setTimeout(resolve, milliSec);
    });
  }
}

export default new Timer();
