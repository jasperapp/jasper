class _PlatformUtil {
  isMac(): boolean {
    return navigator.userAgent.includes('Platform/darwin');
  }

  select(mac: string, other: string): string {
    return this.isMac() ? mac : other;
  }

  getLang(): 'en' | 'ja' {
    return this.isJa() ? 'ja' : 'en';
  }

  isJa(): boolean {
    return navigator.language === 'ja';
  }
}

export const PlatformUtil = new _PlatformUtil();
