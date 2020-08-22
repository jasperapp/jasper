import fs from 'fs';

class _FSBind {
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
    try {
      fs.unlinkSync(path);
    } catch (e) {
      // ignore
    }
  }

  write(path: string, text: string) {
    fs.writeFileSync(path, text);
  }

  read(path): string {
    return fs.readFileSync(path).toString();
  }
}

export const FSBind = new _FSBind();
