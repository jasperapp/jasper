class _DateConverter {
  utcToUnix(utc: string) {
    return new Date(utc).getTime();
  }

  localToUTCString(date: Date) {
    const Y = date.getUTCFullYear();
    const M = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const D = date.getUTCDate().toString().padStart(2, '0');
    const h = date.getUTCHours().toString().padStart(2, '0');
    const m = date.getUTCMinutes().toString().padStart(2, '0');
    const s = date.getUTCSeconds().toString().padStart(2, '0');
    return `${Y}-${M}-${D}T${h}:${m}:${s}Z`;
  }

  localToString(date: Date) {
    const Y = date.getFullYear();
    const M = (date.getMonth() + 1).toString().padStart(2, '0');
    const D = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    const s = date.getSeconds().toString().padStart(2, '0');
    return `${Y}-${M}-${D} ${h}:${m}:${s}`;

    // let month = d.getMonth() + 1;
    // if (month < 10) month = `0${month}`;
    //
    // let date = d.getDate();
    // if (date < 10) date = `0${date}`;
    //
    // let hour = d.getHours();
    // if (hour < 10) hour = `0${hour}`;
    //
    // let minutes = d.getMinutes();
    // if (minutes < 10) minutes = `0${minutes}`;
    //
    // let sec = d.getSeconds();
    // if (sec < 10) sec = `0${sec}`;
    //
    // return `${d.getFullYear()}-${month}-${date} ${hour}:${minutes}:${sec}`;
  }
}

export const DateConverter = new _DateConverter();
