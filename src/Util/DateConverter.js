import moment from 'moment';

export class DateConverter {
  utcToUnix(utc) {
    return moment.utc(utc).toDate().getTime();
  }

  localToUTCString(date) {
    return moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
  }

  localToString(d) {
    let month = d.getMonth() + 1;
    if (month < 10) month = `0${month}`;

    let date = d.getDate();
    if (date < 10) date = `0${date}`;

    let hour = d.getHours();
    if (hour < 10) hour = `0${hour}`;

    let minutes = d.getMinutes();
    if (minutes < 10) minutes = `0${minutes}`;

    let sec = d.getSeconds();
    if (sec < 10) sec = `0${sec}`;

    return `${d.getFullYear()}-${month}-${date} ${hour}:${minutes}:${sec}`;
  }
}

export default new DateConverter();
