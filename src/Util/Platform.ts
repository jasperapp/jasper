import os from 'os';

export class Platform {
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

export default new Platform();
