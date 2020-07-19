import os from 'os';

class _Platform {
  name() {
    return os.platform();
  }

  isMac() {
    return os.platform() === 'darwin';
  }

  isWin() {
    return os.platform() === 'win32';
  }

  isLinux() {
    return os.platform() === 'linux';
  }
}

export const Platform = new _Platform();
