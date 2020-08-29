class _PlatformUtil {
  isMac(): boolean {
    return navigator.userAgent.includes('Platform/darwin');
  }

  getCommandKeyName(): '⌘' | 'Ctrl' {
    return this.isMac() ? '⌘' : 'Ctrl';
  }
}

export const PlatformUtil = new _PlatformUtil();
