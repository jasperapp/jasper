import fs from 'fs';
import path from 'path';

class _PathUtil {
  getSrcPath() {
    return path.normalize(`${__dirname}/../../`);
  }

  getPath(relativePathFromSrc: string) {
    return path.normalize(`${this.getSrcPath()}/${relativePathFromSrc}`);
  }

  // Read directory and iterate through all subdirectories and files
  readDirectory(dirPath: string) {
    const fullPath = this.getPath(dirPath);
    this.iterateDirectory(fullPath);
  }

  private iterateDirectory(dirPath: string) {
    fs.readdir(dirPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(`Error reading directory: ${err.message}`);
        return;
      }

      files.forEach(file => {
        const fullPath = path.join(dirPath, file.name);
        if (file.isDirectory()) {
          console.log(`Directory: ${fullPath}`);
          this.iterateDirectory(fullPath); // Recursively iterate through subdirectories
        } else {
          console.log(`File: ${fullPath}`);
        }
      });
    });
  }
}

export const PathUtil = new _PathUtil();

// Example usage:
PathUtil.readDirectory('some/relative/path');
