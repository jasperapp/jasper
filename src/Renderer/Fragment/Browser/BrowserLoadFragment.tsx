import React, {CSSProperties} from 'react';
import {TextInput} from '../../Library/View/TextInput';
import {shell} from 'electron';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {border, font, fontWeight, icon, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';
import {color} from '../../Library/Style/color';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {IssueEvent} from '../../Event/IssueEvent';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {GARepo} from '../../Repository/GARepo';
import {IconButton} from '../../Library/View/IconButton';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {Icon} from '../../Library/View/Icon';
import {UserIcon} from '../../Library/View/UserIcon';
import {DateUtil} from '../../Library/Util/DateUtil';
import {Text} from '../../Library/View/Text';
import {ClickView} from '../../Library/View/ClickView';
import {GitHubUtil} from '../../Library/Util/GitHubUtil';

type Props = {
  show: boolean;
  onSearchStart: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
  mode: 'normal' | 'url';
  issue: IssueEntity | null;
  url: string;
  loading: boolean;
}

export class BrowserLoadFragment extends React.Component<Props, State> {
  private urlTextInput: TextInput;
  private firstLoading = true;

  state: State = {
    mode: 'normal',
    issue: null,
    url: '',
    loading: false,
  }

  componentDidMount() {
    IssueEvent.onSelectIssue(this, (issue) => this.loadIssue(issue));
    IssueEvent.onUpdateIssues(this, () => this.handleUpdateIssue());
    IssueEvent.onReadAllIssues(this, () => this.handleUpdateIssue());

    BrowserViewIPC.onFocusURLInput(() => this.handleURLMode());

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

    GARepo.eventIssueRead(true);
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

  private handleURLMode() {
    this.setState({mode: 'url'}, () => {
      this.focus();
    });
  }

  // private async handleToggleIssueRead() {
  //   const targetIssue = this.state.issue;
  //   if (!targetIssue) return;
  //
  //   const date = IssueRepo.isRead(targetIssue) ? null : new Date();
  //   const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, date);
  //   if (error) return console.error(error);
  //
  //   this.setState({issue: updatedIssue});
  //   IssueEvent.emitUpdateIssues([updatedIssue], [targetIssue], 'read');
  // }
  //
  // private async handleToggleArchive() {
  //   const targetIssue = this.state.issue;
  //   if (!targetIssue) return;
  //
  //   const date = targetIssue.archived_at ? null : new Date();
  //   const {error, issue: updatedIssue} = await IssueRepo.updateArchive(targetIssue.id, date);
  //   if (error) return console.error(error);
  //
  //   this.setState({issue: updatedIssue});
  //   IssueEvent.emitUpdateIssues([updatedIssue], [targetIssue], 'archive');
  // }
  //
  // private async handleToggleMark() {
  //   const targetIssue = this.state.issue;
  //   if (!targetIssue) return;
  //
  //   const date = targetIssue.marked_at ? null : new Date();
  //   const {error, issue: updatedIssue} = await IssueRepo.updateMark(targetIssue.id, date);
  //   if (error) return console.error(error);
  //
  //   this.setState({issue: updatedIssue});
  //   IssueEvent.emitUpdateIssues([updatedIssue], [targetIssue], 'mark');
  // }

  render() {
    const showClassName = this.props.show ? '' : 'browser-load-hide';
    const loadingClassName = this.state.loading ? 'browser-load-loading' : '';

    return (
      <Root className={`${showClassName} ${loadingClassName} ${this.props.className}`} style={this.props.style}>
        {this.renderBrowserActions1()}
        {this.renderIssueBar()}
        {this.renderURLBar()}
        {/*{this.renderIssueActions()}*/}
        {this.renderBrowserActions2()}
      </Root>
    );
  }

  renderBrowserActions1() {
    const goBarkEnable = !!BrowserViewIPC.canGoBack();
    const goForwardEnable = !!BrowserViewIPC.canGoForward();
    const reloadEnable = !!BrowserViewIPC.getURL();

    return (
      <React.Fragment>
        <IconButton name='arrow-left-bold' onClick={() => this.handleGoBack()} title='Go Back' disable={!goBarkEnable}/>
        <IconButton name='arrow-right-bold' onClick={() => this.handleGoForward()} title='Go Forward' disable={!goForwardEnable}/>
        <IconButton name='reload' onClick={() => this.handleReload()} title='Reload' disable={!reloadEnable}/>
      </React.Fragment>
    );
  }

  renderIssueBar() {
    if (this.state.mode !== 'normal') return;

    if (!this.state.issue) {
      return <IssueBarRoot/>;
    }

    const issue = this.state.issue;
    const {icon: iconName, color: issueColor, label} = GitHubUtil.getIssueTypeInfo(issue);

    return (
      <IssueBarRoot onClick={() => this.handleURLMode()}>
        <UserIcon userName={issue.author} iconUrl={issue.value.user.avatar_url} size={icon.small2}/>
        <IssueType style={{background: issueColor}}>
          <Icon name={iconName} color={color.white}/>
          <IssueTypeLabel>{label}</IssueTypeLabel>
        </IssueType>
        <IssueTitle singleLine={true}>{issue.title}</IssueTitle>
        <IssueUpdatedAt singleLine={true}>{DateUtil.fromNow(new Date(issue.updated_at))}</IssueUpdatedAt>
      </IssueBarRoot>
    );
  }

  renderURLBar() {
    if (this.state.mode !== 'url') return;

    return (
      <URLBarWrap>
        <URLBar
          value={this.state.url}
          onChange={t => this.setState({url: t})}
          onEnter={() => this.handleLoadURL()}
          onClick={() => this.urlTextInput.select()}
          onClear={() => this.setState({mode: 'normal'})}
          onEscape={() => this.setState({mode: 'normal'})}
          showClearButton='always'
          ref={ref => this.urlTextInput = ref}
        />
      </URLBarWrap>
    );
  }

  // renderIssueActions() {
  //   const readIconName: IconNameType = IssueRepo.isRead(this.state.issue) ? 'clipboard-check' : 'clipboard-outline';
  //   const markIconName: IconNameType = this.state.issue?.marked_at ? 'bookmark' : 'bookmark-outline';
  //   const archiveIconName: IconNameType = this.state.issue?.archived_at ? 'archive' : 'archive-outline';
  //
  //   return (
  //     <React.Fragment>
  //       <IconButton name={readIconName} onClick={() => this.handleToggleIssueRead()} title={`${IssueRepo.isRead(this.state.issue) ? 'Mark as Unread' : 'Mark as Read'}`}/>
  //       <IconButton name={markIconName} onClick={() => this.handleToggleMark()} title={`${this.state.issue?.marked_at ? 'Remove from Bookmark' : 'Add to Bookmark'}`}/>
  //       <IconButton name={archiveIconName} onClick={() => this.handleToggleArchive()} title={`${this.state.issue?.archived_at ? 'Remove from Archive' : 'Move to Archive'}`}/>
  //     </React.Fragment>
  //   );
  // }

  renderBrowserActions2() {
    return (
      <React.Fragment>
        <IconButton name='text-box-search-outline' onClick={() => this.props.onSearchStart()} title={`Search Keyword in Page (${PlatformUtil.getCommandKeyName()} + F)`}/>
        <IconButton name='open-in-new' onClick={() => this.handleOpenURL()} title='Open URL with External Browser'/>
      </React.Fragment>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: 10px ${space.medium}px ${space.medium2}px;
  height: 53px;
  
  &.browser-load-hide {
    display: none;
  }
`;

// url bar
const URLBarWrap = styled(View)`
  flex: 1;
  padding: 0 ${space.medium}px;
`;

const URLBar = styled(TextInput)`
  border-radius: 50px;
  background: ${() => appTheme().browserAddressBarColor};
  
  .browser-load-loading & {
    background: ${color.blue};
    color: ${color.white};
  }
`;

// issue bar
const IssueBarRoot = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  padding: ${space.small2}px ${space.medium2}px;
  flex: 1;
  border-radius: 50px;
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  background: ${() => appTheme().browserAddressBarColor};
  margin: 0 ${space.medium}px;
  min-height: 39px;
  
  .browser-load-loading & {
    background: ${color.blue};
    color: ${color.white};
  }
  
  &:hover {
    border-color: ${color.blue};
  }
`;

const IssueType = styled(View)`
  flex-direction: row;
  align-items: center;
  border-radius: 100px;
  padding: ${space.tiny + 1}px ${space.small2}px;
  margin-left: ${space.medium2}px;
`;

const IssueTypeLabel = styled(Text)`
  color: ${color.white};
  font-size: ${font.small}px;
  font-weight: ${fontWeight.bold};
`;

const IssueTitle = styled(Text)`
  font-weight: ${fontWeight.bold};
  padding-left: ${space.medium}px;
  flex: 1;
  
  .browser-load-loading & {
    color: ${color.white};
  }
`;

// const IssueNumber = styled(Text)`
//   font-size: ${font.small}px;
//   color: ${() => appTheme().textSoftColor};
//   padding-left: ${space.small}px;
//
//   .toolbar-loading & {
//     color: ${color.white};
//   }
// `;
//
// const IssueCommentCount = styled(Text)`
//   font-size: ${font.small}px;
//   color: ${() => appTheme().textSoftColor};
// `;

const IssueUpdatedAt = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textSoftColor};
  padding-left: ${space.medium}px;
  
  .browser-load-loading & {
    color: ${color.white};
  }
`;
