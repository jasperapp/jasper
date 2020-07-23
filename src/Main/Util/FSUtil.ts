import fs from 'fs';

class _FSUtil {
  exist(path: string): boolean {
    return fs.existsSync(path);
  }

  mkdir(path: string) {
    fs.mkdirSync(path, {recursive: true});
  }

  // todo: fs.rmdirSync with recursive is experimental
  // https://nodejs.org/dist/latest-v12.x/docs/api/fs.html#fs_fs_rmdirsync_path_options
  rmdir(path: string): boolean {
    try {
      fs.rmdirSync(path, {recursive: true});
      return true;
    } catch(e) {
      return false;
    }
  }

  rm(path: string) {
    fs.unlinkSync(path);
  }

  write(path: string, text: string) {
    fs.writeFileSync(path, text);
  }

  read(path): string {
    return fs.readFileSync(path).toString();
  }

  writeJSON<T>(path: string, json: T) {
    fs.writeFileSync(path, JSON.stringify(json, null, 2));
  }

  readJSON<T>(path: string): T {
    return JSON.parse(fs.readFileSync(path).toString()) as T;
  }

  copy(from: string, to: string) {
    const text = this.read(from);
    this.write(to, text);
  }
}

export const FSUtil = new _FSUtil();
