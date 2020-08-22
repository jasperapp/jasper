class _Platform {
  isMac() {
    return navigator.userAgent.toLowerCase().includes('darwin');
  }

  isWin() {
    return navigator.userAgent.toLowerCase().includes('win32');
  }

  isLinux() {
    return navigator.userAgent.toLowerCase().includes('linux');
  }
}

export const UserAgentUtil = new _Platform();
