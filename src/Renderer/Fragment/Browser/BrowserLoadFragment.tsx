import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {BrowserViewIPCChannels} from '../../../IPC/BrowserViewIPC/BrowserViewIPC.channel';
import {AppEvent} from '../../Event/AppEvent';
import {BrowserEvent} from '../../Event/BrowserEvent';
import {IssueEvent} from '../../Event/IssueEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {appTheme} from '../../Library/Style/appTheme';
import {color} from '../../Library/Style/color';
import {border, font, fontWeight, icon, space} from '../../Library/Style/layout';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {DateUtil} from '../../Library/Util/DateUtil';
import {GitHubUtil} from '../../Library/Util/GitHubUtil';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {ClickView} from '../../Library/View/ClickView';
import {DraggableHeader} from '../../Library/View/DraggableHeader';
import {Icon} from '../../Library/View/Icon';
import {IconButton} from '../../Library/View/IconButton';
import {Text} from '../../Library/View/Text';
import {TextInput} from '../../Library/View/TextInput';
import {TrafficLightsSpace} from '../../Library/View/TrafficLightsSpace';
import {UserIcon} from '../../Library/View/UserIcon';
import {View} from '../../Library/View/View';
import {GARepo} from '../../Repository/GARepo';
import {IssueRepo} from '../../Repository/IssueRepo';
import {StreamRepo} from '../../Repository/StreamRepo';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

type Props = {
  show: boolean;
  onSearchStart: () => void;
  className?: string;
  style?: CSSProperties;
  firstLoading?: boolean;
}

type State = {
  mode: 'issueBar' | 'urlBar' | 'projectBar';
  issue: IssueEntity | null;
  stream: StreamEntity | null;
  projectStream: StreamEntity | null;
  url: string;
  loading: boolean;
}

export class BrowserLoadFragment extends React.Component<Props, State> {
  private urlTextInput: TextInput;
  private firstLoading = this.props.firstLoading ?? true;

  state: State = {
    mode: 'issueBar',
    issue: null,
    stream: null,
    projectStream: null,
    url: '',
    loading: false,
  }

  componentDidMount() {
    StreamEvent.onSelectStream(this, (stream) => {
      this.setState({stream});
      if (stream.type === 'ProjectStream') this.loadProjectStream(stream);
    });

    IssueEvent.onSelectIssue(this, (issue) => this.loadIssue(issue));
    IssueEvent.onUpdateIssues(this, () => this.handleUpdateIssue());
    // IssueEvent.onReadAllIssues(this, () => this.handleUpdateIssue());

    BrowserEvent.onOpenProjectBoard(this, (stream) => {
      if (stream.type === 'ProjectStream') this.loadProjectStream(stream);
    });

    window.ipc.on(BrowserViewIPCChannels.focusURLInput, () => this.handleURLMode());
    window.ipc.on(BrowserViewIPCChannels.openURLWithExternalBrowser, () => this.handleOpenURL());

    this.setupPageLoading();
  }

  componentWillUnmount() {
    IssueEvent.offAll(this);
    StreamEvent.offAll(this);
    BrowserEvent.offAll(this);
  }

  private getMode(url: string): State['mode'] {
    if (GitHubUtil.isTargetIssuePage(url, this.state.issue)) {
      return 'issueBar';
    } else if (GitHubUtil.isProjectUrl(UserPrefRepo.getPref().github.webHost, url)) {
      return 'projectBar';
    } else {
      return 'urlBar';
    }
  }

  // ブラウザ内の遷移(リンクをクリック)によって、別のissueに遷移したら、選択されているissueを変更する。
  private async navigateIssueFromBrowser(url: string): Promise<boolean> {
    if (!this.state.issue) return false;
    if (!GitHubUtil.isIssueUrl(UserPrefRepo.getPref().github.webHost, url)) return false;

    const {repo, issueNumber} = GitHubUtil.getInfo(url);
    if (this.state.issue.number === issueNumber && this.state.issue.repo === repo) return false;

    const {error: e1, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
    if (e1 || !issue) return false;

    this.setState({issue, url}, async () => {
      this.setState({mode: this.getMode(url)});

      const {error, streams} = await StreamRepo.getStreamMatchIssue([issue], true, false, false);
      if (error || !streams) return;

      // 現在のstreamに存在している場合は現在のstreamを、そうでない場合は最適なstreamに移動する
      const isExist = streams.some(s => s.id === this.state.stream.id);
      if (isExist) {
        await StreamEvent.emitSelectStream(this.state.stream, issue, true);
      } else {
        await StreamEvent.emitSelectStream(streams[0], issue, true);
      }
    });
    return true;
  }

  private setupPageLoading() {
    window.ipc.on(BrowserViewIPCChannels.eventDidStartNavigation, async (_ev, url, inPage) => {
      // inPageはアンカーやSPA的な遷移でtrueとなる
      // issueから別のissueに遷移したとき、先読みされている場合はSPA的な遷移になる（同じリポジトリの場合など）
      // なので、inPageだからといって、ハンドリングをキャンセルするわけにないかない
      // if (inPage) return;

      // issueを選択したときに、なぜか直前に選択していたissueのdid-start-navigationが発行されてしまう
      // electronの不具合なのか、IPC通してイベントを受け取っているのがだめなのかよくわからない
      // なので、issue選択した時(つまり今ローディング中)はdid-start-navigationを無視する
      if (this.state.loading) return;

      // iframe srcdoc の読み込み時にもこのイベントが発火され、`about:srcdoc` などが url として渡される
      // これは Jasper で開くために有効な URL ではないので無視する
      if (!url.startsWith('http')) return;

      const isNavigate = await this.navigateIssueFromBrowser(url);
      if (isNavigate) return;

      this.setState({mode: this.getMode(url), url});

      if (!inPage) this.setState({loading: true});
    });

    window.ipc.on(BrowserViewIPCChannels.eventDidNavigate, () => {
      const url = window.ipc.browserView.getURL();
      const mode = this.getMode(url);
      this.setState({loading: false, mode, url});
    });
  }

  focus() {
    window.ipc.browserView.blur();
    this.urlTextInput?.focus();
    this.urlTextInput?.select();
  }

  private loadIssue(issue: IssueEntity) {
    this.loadUrl(issue.html_url);
    this.setState({issue, projectStream: null, mode: 'issueBar'});
    GARepo.eventIssueRead(true);
  }

  private loadProjectStream(projectStream: StreamEntity) {
    if (projectStream.type === 'ProjectStream') {
      this.loadUrl(projectStream.queries[0]);
      this.setState({projectStream, issue: null, mode: 'projectBar'});
    }
  }

  private loadUrl(url: string) {
    if (UserPrefRepo.getPref().general.browser === 'builtin') {
      // 初回のローディングではログインをしてもらうためにログイン画面を表示する
      // note: 本当は「Jasperで初めてローディングするとき」にしたかったけど、難しいので「起動して初回のローディング」とする。
      if (this.firstLoading) {
        this.firstLoading = false;
        url = `https://${UserPrefRepo.getPref().github.webHost}/login?return_to=${encodeURIComponent(url)}`;
      }

      window.ipc.browserView.loadURL(url);
      this.setState({url, loading: true});
    } else {
      // BrowserViewIPC.loadURL('data://'); // blank page
      ShellUtil.openExternal(url);
      this.setState({url});
    }
  }

  private async handleUpdateIssue() {
    if (!this.state.issue) return;

    const {error, issue} = await IssueRepo.getIssue(this.state.issue.id);
    if (error) return console.error(error);

    this.setState({issue});
  }

  private handleOpenURL() {
    ShellUtil.openExternal(this.state.url);
  }

  private handleGoBack() {
    window.ipc.browserView.canGoBack() && window.ipc.browserView.goBack();
  }

  private handleGoForward() {
    window.ipc.browserView.canGoForward() && window.ipc.browserView.goForward();
  }

  private handleReload() {
    window.ipc.browserView.reload();
  }

  private handleLoadURL() {
    window.ipc.browserView.loadURL(this.state.url);
  }

  private handleURLMode() {
    this.setState({mode: 'urlBar'}, () => {
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
    // v1.0.4で起動 -> issue表示 -> コメントやリンク操作ができない不具合がでた
    // - windowsでは起きていない
    // - cmd + 1やzoom操作をすると直る
    // - どうやらドラッグ設定(DraggableHeader)のなにかの不具合を踏んだぽい
    // - BrowserViewが表示タイミング、ドラッグ設定の表示タイミングが問題ぽい
    // - とりあえずworkaroundとして対応する
    // - todo: 原因を正確に確かめてちゃんと対応する
    if (this.firstLoading) return null;

    const showClassName = this.props.show ? '' : 'browser-load-hide';
    const loadingClassName = this.state.loading ? 'browser-load-loading' : '';

    return (
      <Root className={`${showClassName} ${loadingClassName} ${this.props.className}`} style={this.props.style}>
        <TrafficLightsSpace/>
        {this.renderBrowserActions1()}
        {this.renderCenterEmpty()}
        {this.renderCenterIssueBar()}
        {this.renderCenterProjectBar()}
        {this.renderURLBar()}
        {/*{this.renderIssueActions()}*/}
        {this.renderBrowserActions2()}
      </Root>
    );
  }

  renderBrowserActions1() {
    const goBarkEnable = !!window.ipc.browserView.canGoBack();
    const goForwardEnable = !!window.ipc.browserView.canGoForward();
    const reloadEnable = !!window.ipc.browserView.getURL();

    return (
      <React.Fragment>
        <IconButton name='arrow-left-bold' onClick={() => this.handleGoBack()} title='Go Back' disable={!goBarkEnable}/>
        <IconButton name='arrow-right-bold' onClick={() => this.handleGoForward()} title='Go Forward' disable={!goForwardEnable}/>
        <IconButton name='reload' onClick={() => this.handleReload()} title='Reload' disable={!reloadEnable}/>
      </React.Fragment>
    );
  }

  renderCenterEmpty() {
    if (!this.state.issue && !this.state.projectStream) {
      return <CenterBarRoot/>;
    }
  }

  renderCenterIssueBar() {
    if (this.state.mode !== 'issueBar') return;
    if (!this.state.issue) return;

    const issue = this.state.issue;
    const {icon: iconName, color: issueColor, label} = GitHubUtil.getIssueTypeInfo(issue);

    return (
      <CenterBarRoot onClick={() => this.handleURLMode()}>
        <UserIcon userName={issue.author} iconUrl={issue.value.user.avatar_url} size={icon.small2}/>
        <IssueType style={{background: issueColor}}>
          <Icon name={iconName} color={color.white}/>
          <IssueTypeLabel>{label}</IssueTypeLabel>
        </IssueType>
        <IssueTitle singleLine={true}>{issue.title}</IssueTitle>
        <IssueUpdatedAt singleLine={true}>{DateUtil.fromNow(new Date(issue.updated_at))}</IssueUpdatedAt>
      </CenterBarRoot>
    );
  }

  renderCenterProjectBar() {
    if (this.state.mode !== 'projectBar') return;
    if (!this.state.projectStream) return;

    const stream = this.state.projectStream;

    return (
      <CenterBarRoot onClick={() => this.handleURLMode()}>
        <ProjectSymbol style={{background: stream.color}}>
          <Icon name={stream.iconName} color={color.white}/>
          <ProjectSymbolLabel>Project</ProjectSymbolLabel>
        </ProjectSymbol>
        <ProjectName singleLine={true}>{stream.name}</ProjectName>
      </CenterBarRoot>
    );
  }

  renderURLBar() {
    if (this.state.mode !== 'urlBar') return;

    return (
      <URLBarWrap>
        <URLBar
          value={this.state.url}
          onChange={t => this.setState({url: t})}
          onEnter={() => this.handleLoadURL()}
          onClick={() => this.urlTextInput.select()}
          onClear={() => this.setState({mode: this.getMode(this.state.url)})}
          onEscape={() => this.setState({mode: this.getMode(this.state.url)})}
          onBlur={() => this.setState({mode: this.getMode(this.state.url)})}
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
        <IconButton name='text-box-search-outline' onClick={() => this.props.onSearchStart()} title={`Search Keyword in Page (${PlatformUtil.select('⌘', 'Ctrl')} F)`}/>
        <IconButton name='open-in-new' onClick={() => this.handleOpenURL()} title={`Open URL with External Browser (${PlatformUtil.select('⌘', 'Ctrl')} O)`}/>
        <IconButton name='view-week-outline' onClick={() => AppEvent.emitNextLayout()} title={`Change Layout (${PlatformUtil.select('⌘', 'Ctrl')} 1, 2, 3)`}/>
      </React.Fragment>
    );
  }
}

const Root = styled(DraggableHeader)`
  padding: 0 ${space.medium}px;
  
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
  background: ${() => appTheme().bg.third};
  
  .browser-load-loading & {
    background: ${() => appTheme().accent.normal};
    color: ${color.white};
  }
`;

// issue bar
const CenterBarRoot = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  padding: ${space.small2}px ${space.medium2}px;
  flex: 1;
  border-radius: 50px;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  background: ${() => appTheme().bg.third};
  margin: 0 ${space.medium}px;
  min-height: 39px;
  
  .browser-load-loading & {
    background: ${() => appTheme().accent.normal};
    color: ${color.white};
  }
  
  &:hover {
    border-color: ${() => appTheme().accent.normal};
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
  color: ${() => appTheme().text.soft};
  padding-left: ${space.medium}px;
  
  .browser-load-loading & {
    color: ${color.white};
  }
`;

// project bar
const ProjectSymbol = styled(IssueType)`
  margin-left: 0;
`;
const ProjectSymbolLabel = styled(IssueTypeLabel)`
  padding-left: ${space.small}px;
`;
const ProjectName = IssueTitle;
