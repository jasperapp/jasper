class _Color {
  /**
   * calc suite text color with background color.
   * this logic is guessed from github.
   * @param {string} backgroundColor - target background color.
   * @returns {string} text color
   */
  suitTextColor(backgroundColor: string): string {
    const r = parseInt(backgroundColor.substr(0, 2), 16);
    const g = parseInt(backgroundColor.substr(2, 2), 16);
    const b = parseInt(backgroundColor.substr(4, 2), 16);
    if (g >= 240) return '1c2733';

    const colorNum = r * (g - parseInt('66', 16)) * b;
    const mediumColorNum = 1728000; // 0x88 * 0x88 * 0x88
    return colorNum > mediumColorNum ? '1c2733' : 'fff';
  }

  isValid(color: string): boolean {
    return color && !!color.match(/^#[0-9A-Fa-f]{3,6}$/);
  }
}

export const ColorUtil = new _Color();
