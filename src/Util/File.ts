import fs from 'fs-extra';

export class File {
  isExist(path) {
    try {
      fs.readFileSync(path);
      return true;
    } catch(e) {
      return false;
    }
  }
}

export default new File();
