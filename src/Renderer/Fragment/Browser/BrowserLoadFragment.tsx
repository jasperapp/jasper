import React, {CSSProperties} from 'react';
import {Icon} from '../../Component/Core/Icon';
import {Button} from '../../Component/Core/Button';
import {TextInput} from '../../Component/Core/TextInput';
import {shell} from 'electron';
import {IconNameType} from '../../Type/IconNameType';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEntity} from '../../Type/IssueEntity';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {ButtonGroup} from '../../Component/Core/ButtonGroup';
import {border, space} from '../../Style/layout';
import {appTheme} from '../../Style/appTheme';
import {color} from '../../Style/color';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {IssueEvent} from '../../Event/IssueEvent';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

type Props = {
  show: boolean;
  onSearchStart: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
  issue: IssueEntity | null;
  url: string;
  loading: boolean;
}

export class BrowserLoadFragment extends React.Component<Props, State> {
  private urlTextInput: TextInput;
  private firstLoading = true;

  state: State = {
    issue: null,
    url: '',
    loading: false,
  }

  componentDidMount() {
    IssueEvent.onSelectIssue(this, (issue) => this.loadIssue(issue));
    IssueEvent.onUpdateIssues(this, () => this.handleUpdateIssue());
    IssueEvent.onReadAllIssues(this, () => this.handleUpdateIssue());

    BrowserViewIPC.onFocusURLInput(() => this.focus());

    this.setupPageLoading();
  }

  componentWillUnmount() {
    IssueEvent.offAll(this);
  }

  private setupPageLoading() {
    BrowserViewIPC.onEventDidStartLoading(() => this.setState({loading: true}));
    BrowserViewIPC.onEventWillDownload(() => this.setState({loading: false}));

    // todo: consider using did-stop-loading
    BrowserViewIPC.onEventDidNavigate(() => {
      this.setState({url: BrowserViewIPC.getURL(), loading: false});
    });

    BrowserViewIPC.onEventDidNavigateInPage(() => {
      this.setState({url: BrowserViewIPC.getURL(), loading: false});
    });
  }

  focus() {
    BrowserViewIPC.blur();
    this.urlTextInput?.focus();
    this.urlTextInput?.select();
  }

  private loadIssue(issue: IssueEntity) {
    if (UserPrefRepo.getPref().general.browser === 'builtin') {
      let url = issue.html_url;

      // 初回のローディングではログインをしてもらうためにログイン画面を表示する
      // note: 本当は「Jasperで初めてローディングするとき」にしたかったけど、難しいので「起動して初回のローディング」とする。
      if (this.firstLoading) {
        this.firstLoading = false;
        url = `https://${UserPrefRepo.getPref().github.webHost}/login?return_to=${encodeURIComponent(url)}`;
      }

      BrowserViewIPC.loadURL(url);
      this.setState({issue, url, loading: true});
    } else {
      // BrowserViewIPC.loadURL('data://'); // blank page
      shell.openExternal(issue.html_url);
      this.setState({issue, url: issue.html_url});
    }
  }

  private async handleUpdateIssue() {
    if (!this.state.issue) return;

    const {error, issue} = await IssueRepo.getIssue(this.state.issue.id);
    if (error) return console.error(error);

    this.setState({issue});
  }

  private handleOpenURL() {
    shell.openExternal(this.state.url);
  }

  private handleGoBack() {
    BrowserViewIPC.canGoBack() && BrowserViewIPC.goBack();
  }

  private handleGoForward() {
    BrowserViewIPC.canGoForward() && BrowserViewIPC.goForward();
  }

  private handleReload() {
    BrowserViewIPC.reload();
  }

  private handleLoadURL() {
    BrowserViewIPC.loadURL(this.state.url);
  }

  private async handleToggleIssueRead() {
    const targetIssue = this.state.issue;
    if (!targetIssue) return;

    const date = IssueRepo.isRead(targetIssue) ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, date);
    if (error) return console.error(error);

    this.setState({issue: updatedIssue});
    IssueEvent.emitUpdateIssues([updatedIssue], [targetIssue], 'read');
  }

  private async handleToggleArchive() {
    const targetIssue = this.state.issue;
    if (!targetIssue) return;

    const date = targetIssue.archived_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateArchive(targetIssue.id, date);
    if (error) return console.error(error);

    this.setState({issue: updatedIssue});
    IssueEvent.emitUpdateIssues([updatedIssue], [targetIssue], 'archive');
  }

  private async handleToggleMark() {
    const targetIssue = this.state.issue;
    if (!targetIssue) return;

    const date = targetIssue.marked_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateMark(targetIssue.id, date);
    if (error) return console.error(error);

    this.setState({issue: updatedIssue});
    IssueEvent.emitUpdateIssues([updatedIssue], [targetIssue], 'mark');
  }

  render() {
    const showClassName = this.props.show ? '' : 'toolbar-hide';
    const loadingClassName = this.state.loading ? 'toolbar-loading' : '';

    return (
      <Root className={`${showClassName} ${loadingClassName} ${this.props.className}`} style={this.props.style}>
        {this.renderBrowserLoadActions()}
        {this.renderAddressBar()}
        {this.renderIssueActions()}
        {this.renderBrowserSubActions()}
      </Root>
    );
  }

  renderBrowserLoadActions() {
    const goBarkEnable = !!BrowserViewIPC.canGoBack();
    const goForwardEnable = !!BrowserViewIPC.canGoForward();
    const reloadEnable = !!BrowserViewIPC.getURL();

    return (
      <ButtonGroup>
        <Button onClick={() => this.handleGoBack()} title='Go Back' disable={!goBarkEnable}>
          <Icon name='arrow-left-bold'/>
        </Button>
        <Button onClick={() => this.handleGoForward()} title='Go Forward' disable={!goForwardEnable}>
          <Icon name='arrow-right-bold'/>
        </Button>
        <Button onClick={() => this.handleReload()} title='Reload' disable={!reloadEnable}>
          <Icon name='reload'/>
        </Button>
      </ButtonGroup>
    )
  }

  renderAddressBar() {
    return (
      <AddressBarWrap>
        <AddressBar
          value={this.state.url}
          onChange={t => this.setState({url: t})}
          onEnter={() => this.handleLoadURL()}
          onClick={() => this.urlTextInput.select()}
          ref={ref => this.urlTextInput = ref}
        />
      </AddressBarWrap>
    );
  }

  renderIssueActions() {
    const readIconName: IconNameType = IssueRepo.isRead(this.state.issue) ? 'clipboard-check' : 'clipboard-outline';
    const markIconName: IconNameType = this.state.issue?.marked_at ? 'bookmark' : 'bookmark-outline';
    const archiveIconName: IconNameType = this.state.issue?.archived_at ? 'archive' : 'archive-outline';

    return (
      <ButtonGroup>
        <Button onClick={() => this.handleToggleIssueRead()} title={`${IssueRepo.isRead(this.state.issue) ? 'Mark as Unread' : 'Mark as Read'}`}>
          <Icon name={readIconName}/>
        </Button>
        <Button onClick={() => this.handleToggleMark()} title={`${this.state.issue?.marked_at ? 'Remove from Bookmark' : 'Add to Bookmark'}`}>
          <Icon name={markIconName}/>
        </Button>
        <Button onClick={() => this.handleToggleArchive()} title={`${this.state.issue?.archived_at ? 'Remove from Archive' : 'Move to Archive'}`}>
          <Icon name={archiveIconName}/>
        </Button>
      </ButtonGroup>
    );
  }

  renderBrowserSubActions() {
    return (
      <ButtonGroup style={{marginLeft: space.medium}}>
        <Button onClick={() => this.props.onSearchStart()} title='Search Keyword in Page'>
          <Icon name='text-box-search-outline'/>
        </Button>
        <Button onClick={() => this.handleOpenURL()} title='Open URL with External Browser'>
          <Icon name='open-in-new'/>
        </Button>
      </ButtonGroup>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium}px;
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  background: ${() => appTheme().issuesBg};
  
  &.toolbar-hide {
    display: none;
  }
`;

// address bar
const AddressBarWrap = styled(View)`
  flex: 1;
  padding: 0 ${space.medium}px;
`;

const AddressBar = styled(TextInput)`
  border-radius: 50px;
  background: ${() => appTheme().browserAddressBarColor};
  
  .toolbar-loading & {
    background: ${color.blue};
    color: ${color.white};
  }
`;

