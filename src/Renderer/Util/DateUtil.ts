class _DateConverter {
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
  }

  fromNow(date: Date) {
    const diffSec = (Date.now() - date.getTime()) / 1000;
    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffSec < 3600) {
      return `${Math.floor(diffSec / 60)} minutes ago`;
    } else if (diffSec < 3600 * 24) {
      return `${Math.floor(diffSec / 3600)} hours ago`;
    } else if (diffSec < 3600 * 24 * 7) {
      return `${Math.floor(diffSec / (3600 * 24))} days ago`;
    } else if (diffSec < 3600 * 24 * 30) {
      return `${Math.floor(diffSec / (3600 * 24 * 7))} week ago`;
    } else if (diffSec < 3600 * 24 * 365) {
      return `${Math.floor(diffSec / (3600 * 24 * 30))} month ago`;
    } else {
      return `${Math.floor(diffSec / (3600 * 24 * 365))} years ago`;
    }
  }
}

export const DateUtil = new _DateConverter();
