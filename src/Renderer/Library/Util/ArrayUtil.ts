class _ArrayUtil {
  unique<T = any>(values: T[]): T[] {
    return Array.from(new Set(values));
  }

  uniqueFn<T = any>(values: T[], fn: (value: T) => string): T[] {
    const res: Record<string, T> = {};
    values.forEach((value) => {
      const key = fn(value);
      if (!(key in res)) res[key] = value;
    });
    return Object.values(res);
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
