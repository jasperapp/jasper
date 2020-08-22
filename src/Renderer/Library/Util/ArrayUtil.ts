class _ArrayUtil {
  unique<T = any>(values: T[]): T[] {
    return Array.from(new Set(values));
  }
}

export const ArrayUtil = new _ArrayUtil();
