import {FSIPC} from '../../../IPC/FSIPC';

class _FS {
  async exist(path: string): Promise<boolean> {
    return FSIPC.exist(path);
  }

  async mkdir(path: string) {
    await FSIPC.mkdir(path);
  }

  async rmdir(path: string): Promise<boolean> {
    return FSIPC.rmdir(path);
  }

  async rm(path: string) {
    await FSIPC.rm(path);
  }

  async write(path: string, text: string) {
    await FSIPC.write(path, text);
  }

  async read(path): Promise<string> {
    return FSIPC.read(path);
  }

  async writeJSON<T>(path: string, json: T) {
    await FSIPC.write(path, JSON.stringify(json, null, 2));
  }

  async readJSON<T>(path: string): Promise<T> {
    const text = await FSIPC.read(path);
    return JSON.parse(text) as T;
  }

  async copy(from: string, to: string) {
    const text = await this.read(from);
    await this.write(to, text);
  }
}

export const FS = new _FS();
