class _PlatformUtil {
  isMac(): boolean {
    return navigator.userAgent.includes('Platform/darwin');
  }
}

export const PlatformUtil = new _PlatformUtil();
