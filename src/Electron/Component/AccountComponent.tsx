import {remote} from 'electron';
import React from 'react';
import {LibraryStreamEmitter} from '../LibraryStreamEmitter';
import {StreamEmitter} from '../StreamEmitter';
import {SystemStreamEmitter} from '../SystemStreamEmitter';
import {AccountEmitter} from '../AccountEmitter';
import {Timer} from '../../Util/Timer';
import {RemoteConfig as Config} from '../Remote';
import {GARepo} from '../Repository/GARepo';
import {AccountIPC} from '../../IPC/AccountIPC';
import {GitHubClient} from '../Infra/GitHubClient';
const {MenuItem, Menu} = remote;

/**
 * `account` = `config.github` = `{accessToken, host, https, interval, pathPrefix, webHost}`
 */

interface State {
  avatars: any[];
  activeIndex: any;
}
export class AccountComponent extends React.Component<any, State> {
  state: State = {avatars: [], activeIndex: Config.activeIndex};
  private readonly _listenerIds: number[] = [];

  constructor(props) {
    super(props);
    this._fetchGitHubIcons();
  }

  componentDidMount() {
    let id;

    id = AccountEmitter.addCreateAccountListener(this._createAccount.bind(this));
    this._listenerIds.push(id);

    id = AccountEmitter.addRewriteAccountListener(this._rewriteAccount.bind(this));
    this._listenerIds.push(id);
  }

  componentWillUnmount() {
    AccountEmitter.removeListeners(this._listenerIds);
  }

  async _fetchGitHubIcons() {
    const avatars = [];
    for (const config of Config.configs) {
      const client = new GitHubClient(config.github.accessToken, config.github.host, config.github.pathPrefix, config.github.https);
      const response = await client.request('/user');
      const body = response.body;
      avatars.push({loginName: body.login, avatar: body.avatar_url});
    }

    this.setState({avatars});
  }

  async _switchConfig(index) {
    // hack: dom
    document.body.style.opacity = '0.3';

    this.setState({activeIndex: index});

    await AccountIPC.switchAccount(index);

    LibraryStreamEmitter.emitSelectFirstStream();
    StreamEmitter.emitRestartAllStreams();
    SystemStreamEmitter.emitRestartAllStreams();

    await Timer.sleep(100);
    document.body.style.opacity = '1';

    GARepo.eventAccountSwitch();
  }

  _createAccount(account) {
    Config.addConfigGitHub(account);
    this._fetchGitHubIcons();
    GARepo.eventAccountCreate();
  }

  _rewriteAccount(index, account) {
    Config.updateConfigGitHub(index, account);
    this._fetchGitHubIcons();
  }

  _handleOpenCreateSetting() {
    AccountEmitter.emitOpenAccountSetting();
  }

  _handleContextMenu(index, avatar) {
    const menu = new Menu();

    menu.append(new MenuItem({
      label: 'Edit',
      click: ()=>{
        const account = Config.configs[index].github;
        AccountEmitter.emitOpenAccountSetting(index, account);
      }
    }));

    // can not delete config when config count is one.
    if (Config.configs.length > 1) {
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Delete',
        click: async ()=>{
          if (confirm(`Would you delete "${avatar.loginName}"?`)) {
            Config.deleteConfig(index);
            await this._fetchGitHubIcons();
            this._switchConfig(0);
            GARepo.eventAccountDelete();
          }
        }
      }));
    }

    menu.popup({window: remote.getCurrentWindow()});
  }

  render() {
    const nodes = this.state.avatars.map((avatar, index) => {
      const className = this.state.activeIndex === index ? 'account active' : 'account';
      const img = avatar.avatar ? <img src={avatar.avatar}/> : <span className="icon icon-block"/>;
      return <div key={index} title={avatar.loginName} className={className}
                  onClick={this._switchConfig.bind(this, index)}
                  onContextMenu={this._handleContextMenu.bind(this, index, avatar)}>
            {img}
      </div>
    });

    return (<nav className="nav-group accounts">
      <h5 className="nav-group-title">
        <span>ACCOUNTS</span>
        <span className="icon icon-plus stream-add" title="add account" onClick={this._handleOpenCreateSetting.bind(this)}/>
      </h5>
      <div>
        {nodes}
      </div>
    </nav>);
  }
}
