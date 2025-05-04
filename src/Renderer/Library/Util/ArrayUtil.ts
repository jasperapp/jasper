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
    const sortedValues = [...values].sort((a, b) => b.length - a.length);
    const results: string[] = [''];

    sortedValues.forEach((value) => {
      for (let i = 0; i < results.length; ++i) {
        if (results[i].length + value.length + 1 < maxLength) {
          results[i] = `${results[i]} ${value}`.trim();
          return;
        }
      }
      results.push(value);
    });

    return results;
  }
}

export const ArrayUtil = new _ArrayUtil();
