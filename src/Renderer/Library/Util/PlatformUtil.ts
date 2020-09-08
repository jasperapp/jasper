class _PlatformUtil {
  isMac(): boolean {
    return navigator.userAgent.includes('Platform/darwin');
  }

  select(mac: string, other: string): string {
    return this.isMac() ? mac : other;
  }
}

export const PlatformUtil = new _PlatformUtil();
