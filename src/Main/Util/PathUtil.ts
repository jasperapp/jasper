import path from 'path';

class _PathUtil {
  getSrcPath() {
    return path.normalize(`${__dirname}/../../`);
  }

  getPath(relativePathFromSrc: string) {
    return path.normalize(`${this.getSrcPath()}/${relativePathFromSrc}`);
  }
}

export const PathUtil = new _PathUtil();
