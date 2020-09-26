class _ArrayUtil {
  unique<T = any>(values: T[]): T[] {
    return Array.from(new Set(values));
  }

  joinWithMax(values: string[], maxLength: number): string[] {
    const results: string[] = [];

    for (let i = 0; i < values.length; i++) {
      let result: string = '';
      for (; i < values.length; i++) {
        if (result.length + values[i].length + 1 < maxLength) {
          result = `${result} ${values[i]}`.trim();
        } else {
          i--;
          break;
        }
      }
      results.push(result);
    }

    return results;
  }
}

export const ArrayUtil = new _ArrayUtil();
