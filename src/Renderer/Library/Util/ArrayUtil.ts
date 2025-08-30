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

  joinWithMax(values: string[], maxLength: number, joiner: string): string[] {
    const results: string[] = [];

    for (let i = 0; i < values.length; i++) {
      const targetValues: string[] = [];

      for (; i < values.length; i++) {
        const tmp = [...targetValues, values[i]].join(joiner);
        if (tmp.length < maxLength) {
          targetValues.push(values[i]);
        } else {
          i--;
          break;
        }
      }

      results.push(targetValues.join(joiner));
    }

    return results;
  }
}

export const ArrayUtil = new _ArrayUtil();
