import React from 'react';
import ReactDOM from 'react-dom';
import AccountEmitter from '../AccountEmitter';
import Validator from '../Validator';

/**
 * `account` = `config.github` = `{accessToken, host, https, interval, pathPrefix, webHost}`
 */
export default class AccountSettingComponent extends React.Component {
  private _index: number = null;
  private _account: any = null;
  private readonly _listenerIds: number[] = [];

  componentDidMount() {
    let id;
    id = AccountEmitter.addOpenAccountSettingListener(this._show.bind(this));
    this._listenerIds.push(id);

    const dialog = ReactDOM.findDOMNode(this);
    dialog.addEventListener('close', ()=>{
      AccountEmitter.emitCloseAccountSetting(this._index, this._account);
    });
  }

  componentWillUnmount() {
    AccountEmitter.removeListeners(this._listenerIds);
  }

  _show(index, account) {
    this._index = index;
    this._account = account;
    const dialog = ReactDOM.findDOMNode(this);

    if (account) {
      if (account.host === 'api.github.com') {
        this._handleSelectGitHub();
      } else {
        this._handleSelectGHE();
      }
      dialog.querySelector('#configHost').value = account.host;
      dialog.querySelector('#configWebHost').value = account.webHost;
      dialog.querySelector('#configAccessToken').value = account.accessToken;
      dialog.querySelector('#configPathPrefix').value = account.pathPrefix;
      dialog.querySelector('#configInterval').value = account.interval;
      dialog.querySelector('#configHttps').checked = account.https;
    } else {
      this._handleSelectGitHub();
    }

    dialog.showModal();
  }

  _handleCancel() {
    const dialog = ReactDOM.findDOMNode(this);
    dialog.close();
  }

  _handleOK() {
    const dialog = ReactDOM.findDOMNode(this);
    const account = {
      host: dialog.querySelector('#configHost').value,
      webHost: dialog.querySelector('#configWebHost').value,
      accessToken: dialog.querySelector('#configAccessToken').value,
      pathPrefix: dialog.querySelector('#configPathPrefix').value,
      interval: parseInt(dialog.querySelector('#configInterval').value, 10),
      https: dialog.querySelector('#configHttps').checked
    };

    if (!account.interval || account.interval < 10) return;
    if (!Validator.validateSetup(account)) return;


    if (this._account) {
      AccountEmitter.emitRewriteAccount(this._index, account);
    } else {
      AccountEmitter.emitCreateAccount(account);
    }

    dialog.close();
  }

  _handleSelectGitHub() {
    const dialog = ReactDOM.findDOMNode(this);
    dialog.querySelector('#configHost').value = 'api.github.com';
    dialog.querySelector('#configWebHost').value = 'github.com';
    dialog.querySelector('#configAccessToken').value = '';
    dialog.querySelector('#configPathPrefix').value = '';
    dialog.querySelector('#configPathPrefix').parentElement.parentElement.style.display = 'none';
    dialog.querySelector('#configInterval').value = '10';
    dialog.querySelector('#configHttps').checked = true;
  }

  _handleSelectGHE() {
    const dialog = ReactDOM.findDOMNode(this);
    dialog.querySelector('#configHost').value = '';
    dialog.querySelector('#configWebHost').value = '';
    dialog.querySelector('#configAccessToken').value = '';
    dialog.querySelector('#configPathPrefix').value = '/api/v3/';
    dialog.querySelector('#configPathPrefix').parentElement.parentElement.style.display = null;
    dialog.querySelector('#configInterval').value = '10';
    dialog.querySelector('#configHttps').checked = true;
  }

  render() {
    return (
      <dialog className="account-setting">
        <div className="window">
          <div className="window-content">
            <div>

              <div className="select-github-buttons">
                <button className="btn btn-large btn-positive" onClick={this._handleSelectGitHub.bind(this)}>GitHub (github.com)</button>
                <button className="btn btn-large btn-positive" onClick={this._handleSelectGHE.bind(this)}>GitHub Enterprise</button>
              </div>

              <table>
                <tbody>
                <tr>
                  <td>API Host:</td>
                  <td><input id="configHost" className="form-control" placeholder="api.github.com or ghe.example.com"/></td>
                </tr>
                <tr>
                  <td>Web Host:</td>
                  <td><input id="configWebHost" className="form-control" placeholder="github.com or ghe.example.com"/></td>
                </tr>
                <tr>
                  <td>Access Token:</td>
                  <td><input id="configAccessToken" className="form-control" placeholder="your access token"/></td>
                </tr>
                <tr>
                  <td>Path Prefix:</td>
                  <td><input id="configPathPrefix" className="form-control" placeholder="/api/v3/"/></td>
                </tr>
                <tr>
                  <td>API Interval(sec):</td>
                  <td><input id="configInterval" className="form-control" placeholder="10" defaultValue='10'/></td>
                </tr>
                <tr>
                  <td>Use HTTPS:</td>
                  <td><input id="configHttps" type="checkbox" className="form-control"/></td>
                </tr>
                </tbody>
              </table>

              <div className="form-actions split-buttons">
                <span className="flex-stretch"/>
                <button className="btn btn-form btn-default" onClick={this._handleCancel.bind(this)}>Cancel</button>
                <button className="btn btn-form btn-primary" onClick={this._handleOK.bind(this)}>OK</button>
              </div>

            </div>
          </div>

          <footer className="toolbar toolbar-footer"/>
        </div>
      </dialog>
    );
  }
}
