import React from 'react';
import ReactDOM from 'react-dom';
// import electron from 'electron';
import {SystemStreamId, SystemStreamRepo} from '../../../Repository/SystemStreamRepo';
import {SystemStreamEvent} from '../../../Event/SystemStreamEvent';
import {StreamEvent} from '../../../Event/StreamEvent';
import {LibraryStreamEvent} from '../../../Event/LibraryStreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {ModalSystemStreamSettingFragment} from './ModalSystemStreamSettingFragment'
import {GARepo} from '../../../Repository/GARepo';
import {ConfigRepo} from '../../../Repository/ConfigRepo';
import {StreamPolling} from '../../../Infra/StreamPolling';
import {SubscriptionIssuesRepo} from '../../../Repository/SubscriptionIssuesRepo';
import {SystemStreamEntity} from '../../../Type/StreamEntity';
import {MenuType} from '../../../Component/Core/ContextMenu';
import {StreamRow} from '../../../Component/StreamRow';
import {SideSection} from '../../../Component/SideSection';
import {SideSectionTitle} from '../../../Component/SideSectionTitle';

// const remote = electron.remote;
// const MenuItem = remote.MenuItem;
// const Menu = remote.Menu;

type Props = {
}

type State = {
  streams: SystemStreamEntity[];
  selectedStream: SystemStreamEntity;
}

export class SystemStreamsFragment extends React.Component<Props, State> {
  state: State = {streams: [], selectedStream: null};

  componentDidMount() {
    this.loadStreams();

    LibraryStreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));

    SystemStreamEvent.onUpdateStream(this, this.loadStreams.bind(this));
    SystemStreamEvent.onSelectStream(this, (stream)=>{
      if (stream.enabled) this.setState({selectedStream: stream});
    });
    SystemStreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

   StreamEvent.onUpdateStream(this, this.loadStreams.bind(this));
   StreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));
   StreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    IssueEvent.onReadIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this.loadStreams.bind(this));
    IssueEvent.addArchiveIssueListener(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this.loadStreams.bind(this));
  }

  componentWillUnmount() {
    SystemStreamEvent.offAll(this);
    StreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    const {error, systemStreams} = await SystemStreamRepo.getAllSystemStreams();
    if (error) return console.error(error);
    this.setState({streams: systemStreams});
  }

  private handleClick(stream) {
    if (stream.enabled) {
      SystemStreamEvent.emitSelectStream(stream);
      this.setState({selectedStream: stream});
      GARepo.eventSystemStreamRead(stream.name);
    }
  }

  // private async handleContextMenu(stream: SystemStreamEntity, evt) {
  //   evt.preventDefault();
  //
  //   // hack: dom operation
  //   const currentTarget = evt.currentTarget;
  //   currentTarget.classList.add('focus');
  //
  //   const menu = new Menu();
  //   menu.append(new MenuItem({
  //     label: 'Mark All as Read',
  //     click: async ()=> {
  //       if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
  //         // const {error} = await IssueRepo.readAll(stream.id);
  //         const {error} = await IssueRepo.updateReadAll(stream.id, stream.defaultFilter);
  //         if (error) return console.error(error);
  //         IssueEvent.emitReadAllIssues(stream.id);
  //         GARepo.eventSystemStreamReadAll(stream.name);
  //       }
  //     }
  //   }));
  //
  //   menu.append(new MenuItem({
  //     label: 'Edit',
  //     click: ()=> SystemStreamEvent.emitOpenStreamSetting(stream)
  //   }));
  //
  //   if (stream.id === SystemStreamId.subscription) {
  //     menu.append(new MenuItem({ type: 'separator' }));
  //
  //     menu.append(new MenuItem({
  //       label: 'Subscribe Issue',
  //       click: this.openSubscribeDialog.bind(this, stream)
  //     }));
  //   }
  //
  //   menu.popup({
  //     window: remote.getCurrentWindow(),
  //     callback: () => {
  //       // hack: dom operation
  //       currentTarget.classList.remove('focus');
  //     }
  //   });
  // }

  private async handleMarkAllRead(stream: SystemStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(stream.id, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventSystemStreamReadAll(stream.name);
    }
  }

  private async handleEdit(stream: SystemStreamEntity) {
    SystemStreamEvent.emitOpenStreamSetting(stream);
  }

  private async handleSubscribe() {
    this.openSubscribeDialog()
  }

  private openSubscribeDialog() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    dialog.querySelector('#urlInput').value = '';
    dialog.showModal();
    SystemStreamEvent.emitOpenSubscriptionSetting();
  }

  private async handleSubscriptionOK() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    const url = dialog.querySelector('#urlInput').value;
    if (!this.isIssueUrl(url)) return;

    dialog.close();
    SystemStreamEvent.emitCloseSubscriptionSetting();

    const {error} = await SubscriptionIssuesRepo.subscribe(url);
    if (error) return console.error(error);

    await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
    SystemStreamEvent.emitRestartAllStreams();
    await this.loadStreams();

    const stream = this.state.streams.find((stream)=> stream.id === SystemStreamId.subscription);
    this.handleClick(stream);
  }

  private handleSubscriptionCancel() {
    const dialog = ReactDOM.findDOMNode(this).querySelector('.add-subscription-url');
    dialog.close();
    SystemStreamEvent.emitCloseSubscriptionSetting();
  }

  private isIssueUrl(url) {
    if (!url) return false;
    const host = ConfigRepo.getConfig().github.webHost;

    let isIssue = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/issues/\\d+$`));
    let isPR = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/pull/\\d+$`));

    return isIssue || isPR;
  }

  render() {
    // function iconClassName(stream) {
    //   switch (stream.id) {
    //     case -1: return 'icon icon-user';
    //     case -2: return 'icon icon-users';
    //     case -3: return 'icon icon-eye';
    //     case -4: return 'icon icon-megaphone';
    //   }
    // }
    //
    // function title(stream) {
    //   switch (stream.id) {
    //     case -1: return 'issues you created, assigned, commented, mentioned or your repository';
    //     case -2: return 'issues your team is mentioned in';
    //     case -3: return 'issues of repository you watch';
    //     case -4: return 'issues you subscribed to';
    //   }
    // }
    //
    // const streamNodes = this.state.streams.map((stream)=>{
    //   const selected = this.state.selectedStream && this.state.selectedStream.id === stream.id ? 'active' : '';
    //   const enabled = stream.enabled ? 'enabled' : 'disabled';
    //   const unread = stream.unreadCount > 0 && stream.enabled ? 'is-unread' : '';
    //   return (
    //     <a key={stream.id}
    //        title={title(stream)}
    //        className={`nav-group-item ${selected} ${enabled} ${unread}`}
    //        onClick={this.handleClick.bind(this, stream)}
    //        onContextMenu={this.handleContextMenu.bind(this, stream)}>
    //
    //       <span className={iconClassName(stream)}/>
    //       <span className="stream-name">{stream.name}</span>
    //       <span className="stream-unread-count">{stream.enabled ? stream.unreadCount : '-'}</span>
    //     </a>
    //   );
    // });

    return (
      <SideSection>
        <SideSectionTitle>SYSTEM</SideSectionTitle>
        {/*{streamNodes}*/}
        {this.renderStreams()}
        {this.renderSubscription()}
      <ModalSystemStreamSettingFragment/>
    </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map((stream, index) => {
      const menus: MenuType[] = [
        {label: 'Mark All as Read', handler: () => this.handleMarkAllRead(stream)},
        {label: 'Edit', handler: () => this.handleEdit(stream)},
      ];

      if (stream.id === SystemStreamId.subscription) {
        menus.push({label: 'Subscribe', handler: () => this.handleSubscribe()});
      }

      return (
        <StreamRow
          stream={stream}
          contextMenuRows={menus}
          selected={this.state.selectedStream?.name === stream.name}
          onClick={() => this.handleClick(stream)}
          key={index}
        />
      );
    });
  }

  private renderSubscription() {
    return (
      <dialog className="add-subscription-url">
        <div className="window">
          <div className="window-content">

            <div>
              <p>Please enter issue url you want subscribe to.</p>
              <div className="form-group">
                <input id="urlInput" className="form-control" placeholder="https://github.com/foo/bar/issues/1"/>
              </div>

              <div className="form-actions">
                <button className="btn btn-form btn-default" onClick={this.handleSubscriptionCancel.bind(this)}>Cancel</button>
                <button className="btn btn-form btn-primary" onClick={this.handleSubscriptionOK.bind(this)}>OK</button>
              </div>
            </div>
          </div>
          <footer className="toolbar toolbar-footer"/>
        </div>
      </dialog>
    );
  }
}
