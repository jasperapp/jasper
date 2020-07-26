import React from 'react';
import {LibraryStreamEvent} from '../Event/LibraryStreamEvent';
import {StreamEvent} from '../Event/StreamEvent';
import {SystemStreamEvent} from '../Event/SystemStreamEvent';
import {AccountEvent} from '../Event/AccountEvent';
import {Timer} from '../../Util/Timer';
import {GARepo} from '../Repository/GARepo';
import {GitHubClient} from '../Infra/GitHubClient';
import {Config} from '../Config';
import {StreamPolling} from '../Infra/StreamPolling';
import {DBSetup} from '../Infra/DBSetup';
import {StreamSetup} from '../Infra/StreamSetup';
import {FragmentEvent} from '../Event/FragmentEvent';

/**
 * `account` = `config.github` = `{accessToken, host, https, interval, pathPrefix, webHost}`
 */

interface State {
  avatars: any[];
  activeIndex: any;
}
export class AccountComponent extends React.Component<any, State> {
  state: State = {avatars: [], activeIndex: Config.getIndex()};
  private readonly _listenerIds: number[] = [];

  constructor(props) {
    super(props);
    this._fetchGitHubIcons();
  }

  componentDidMount() {
    let id;

    id = AccountEvent.addCreateAccountListener(this._createAccount.bind(this));
    this._listenerIds.push(id);

    id = AccountEvent.addRewriteAccountListener(this._rewriteAccount.bind(this));
    this._listenerIds.push(id);
  }

  componentWillUnmount() {
    AccountEvent.removeListeners(this._listenerIds);
  }

  async _fetchGitHubIcons() {
    const avatars = [];
    for (const config of Config.getConfigs()) {
      const github = config.github;
      const client = new GitHubClient(github.accessToken,github.host, github.pathPrefix, github.https);
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

    await StreamPolling.stop();

    const {error} = await Config.switchConfig(index);
    if (error) return console.error(error);

    await DBSetup.exec(index);
    await StreamSetup.exec();
    StreamPolling.start();

    LibraryStreamEvent.emitSelectFirstStream();
    StreamEvent.emitRestartAllStreams();
    SystemStreamEvent.emitRestartAllStreams();

    await Timer.sleep(100);
    document.body.style.opacity = '1';

    GARepo.eventAccountSwitch();
  }

  _createAccount() {
    this._fetchGitHubIcons();
  }

  _rewriteAccount(index, account) {
    Config.updateConfigGitHub(index, account);
    this._fetchGitHubIcons();
  }

  _handleOpenCreateSetting() {
    FragmentEvent.emitShowConfigSetup();
  }

  render() {
    const nodes = this.state.avatars.map((avatar, index) => {
      const className = this.state.activeIndex === index ? 'account active' : 'account';
      const img = avatar.avatar ? <img src={avatar.avatar}/> : <span className="icon icon-block"/>;
      return (
        <div key={index} title={avatar.loginName} className={className} onClick={this._switchConfig.bind(this, index)}>
          {img}
        </div>
      );
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
