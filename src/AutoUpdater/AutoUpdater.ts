import electron from 'electron';
import path from 'path';
import https from 'https';
import fs from 'fs-extra';
import Zip from 'node-zip';

// this AutoUpdater is very prototype.
// un-resolved problem is here
// - [ ] permission of Windows
// - [ ] symlinks in Mac/Linux/Windows
// - [ ] inspect on Linux/Windows
// - [ ] can override self binary in this process?

export class AutoUpdater {
  async start() {
    // hack: Electron automatically handling asar-file
    // see https://github.com/electron/electron/blob/787bc8570382e98c4f204abff05b2af122e5a422/lib/common/asar.js#L173
    process.noAsar = true;

    const tempZipPath = path.join(electron.app.getPath('temp'), 'jasper.zip');
    const tempPath = path.join(electron.app.getPath('temp'), 'jasper');
    fs.removeSync(tempZipPath);
    fs.removeSync(tempPath);

    try {
      const data = await this._fetchFile();
      const zip = new Zip(data, {base64: false, checkCRC32: true});

      const symlinks = [];
      for (const name of Object.keys(zip.files)) {
        // mac zip file includes meta-file(?)
        if (name.indexOf('__MACOSX') === 0) continue;

        const file = zip.files[name];
        const outputPath = path.join(tempPath, file.name);
        if (file.dir) {
          fs.ensureDirSync(outputPath);
        } else {
          if (this._isSymlink(file)) {
            symlinks.push(file);
          } else {
            fs.outputFileSync(outputPath, file._data, {encoding: 'binary'});
            // todo: handling Windows
            fs.chmodSync(outputPath, file.unixPermissions);
          }
        }
      }

      // hack: target of symlink must be exists before create symlinks.
      // `reverse` is hack for it.
      symlinks.reverse();
      for (const file of symlinks) {
        fs.ensureSymlinkSync(file._data, path.join(tempPath, file.name));
      }

      delete process.noAsar;

    } catch(e) {
      console.log(e);
    }
  }

  _isSymlink(file) {
    // see https://github.com/Stuk/jszip/issues/257#issuecomment-182603546
    return (file.unixPermissions & 0o170000) === 0o120000;
  }

  async _fetchFile() {
    const url = await this._fetchUrl();

    return new Promise((resolve, reject)=> {
      https.get(url, (res) => {
        const statusCode = res.statusCode;

        let body = '';
        res.on('data', (chunk) => body += chunk);

        res.on('end', ()=> {
          if (statusCode !== 200) {
            reject(new Error(body));
          }
          resolve(body);
        });

      }).on('error', (e) => {
        console.error(e);
        reject(e);
      });
    });
  }

  _fetchUrl() {
    return new Promise((resolve, reject)=> {
      const url = 'https://github.com/jasperapp/jasper/releases/download/v0.1.2/jasper_v0.1.2_trial_mac.app.zip';

      const req = https.get(url, (res) => {
        const statusCode = res.statusCode;
        if (statusCode === 302) {
          resolve(res.headers.location);
        } else {
          resolve(url);
        }

        req.abort();
      });

      req.on('error', (e) => {
        console.error(e);
        reject(e);
      });
    });
  }
}

export default new AutoUpdater();
