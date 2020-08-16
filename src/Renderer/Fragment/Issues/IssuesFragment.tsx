import React from 'react';
import ReactDOM from 'react-dom';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEvent} from '../../Event/IssueEvent';
import {SystemStreamId} from '../../Repository/SystemStreamRepo';
import {WebViewEvent} from '../../Event/WebViewEvent';
import {ConfigRepo} from '../../Repository/ConfigRepo';
import {StreamPolling} from '../../Infra/StreamPolling';
import {SubscriptionIssuesRepo} from '../../Repository/SubscriptionIssuesRepo';
import {LibraryStreamRepo} from '../../Repository/LibraryStreamRepo';
import {BaseStreamEntity, FilteredStreamEntity} from '../../Type/StreamEntity';
import {IssueFilterFragment} from './IssueFilterFragment';
import {IssueEntity} from '../../Type/IssueEntity';
import styled from 'styled-components';
import {IssueRow} from '../../Component/IssueRow';
import {IssueUpdatedBannerFragment} from './IssueUpdatedBannerFragment';
import {TimerUtil} from '../../Util/TimerUtil';
import {ScrollView} from '../../Component/Core/ScrollView';
import {Loading} from '../../Component/Loading';
import {appTheme} from '../../Style/appTheme';
import {IssueSortFragment, SortQueryEntity} from './IssueSortFragment';
import {IssueIPC} from '../../../IPC/IssueIPC';
import {shell} from 'electron';
import {border} from '../../Style/layout';

type Props = {
  className?: string;
}

type State = {
  stream: BaseStreamEntity | null;
  filterQuery: string;
  sortQuery: SortQueryEntity;
  page: number;
  end: boolean;
  issues: IssueEntity[];
  selectedIssue: IssueEntity;
  loading: boolean;
  updatedIssueIds: number[];
  fadeInIssueIds: number[];
}

export class IssuesFragment extends React.Component<Props, State> {
  static defaultProps = {className: ''};

  state: State = {
    stream: null,
    filterQuery: '',
    sortQuery: 'sort:updated',
    page: -1,
    end: false,
    issues: [],
    selectedIssue: null,
    loading: false,
    updatedIssueIds: [],
    fadeInIssueIds: [],
  };

  private scrollView: ScrollView;
  private lock: boolean = false;

  componentDidMount() {
    SystemStreamEvent.onSelectStream(this, (stream, issue)=>{
      this.setState({stream, page: -1, end: false, filterQuery: '', selectedIssue: issue, updatedIssueIds: []}, () => {
        this.loadIssues();
      });
    });

    StreamEvent.onSelectStream(this, (stream, filteredStream, issue)=>{
      const targetStream = stream || filteredStream;
      this.setState({stream: targetStream, page: -1, end: false, filterQuery: filteredStream?.filter || '', selectedIssue: issue, updatedIssueIds: []}, () => {
        this.loadIssues();
      });
    });

    LibraryStreamEvent.onSelectStream(this, async (streamName, issue) => {
      const {error, libraryStream} = await LibraryStreamRepo.getLibraryStream(streamName);
      if (error) return console.error(error);
      this.setState({stream: libraryStream, page: -1, end: false, filterQuery: '', selectedIssue: issue, updatedIssueIds: []}, () => {
        this.loadIssues();
      });
    });

    IssueEvent.onSelectIssue(this, (issue) => this.handleSelectIssue(issue));
    IssueEvent.onReadAllIssues(this, () => this.handleReloadIssuesWithUnselectIssue());
    IssueEvent.onReadAllIssuesFromLibrary(this, () => this.loadIssues);
    IssueEvent.onReadIssue(this, (issue) => this.handleUpdateIssue(issue));
    IssueEvent.onMarkIssue(this, (issue) => this.handleUpdateIssue(issue));
    IssueEvent.onArchiveIssue(this, (issue) => this.handleUpdateIssue(issue));

    IssueIPC.onReloadIssues(() => this.handleReloadIssuesWithUnselectIssue());
    IssueIPC.onSelectNextIssue(() => this.handleSelectNextPrevIssue(1));
    IssueIPC.onSelectNextUnreadIssue(() => this.handleSelectNextPrevIssue(1, true));
    IssueIPC.onSelectPrevIssue(() => this.handleSelectNextPrevIssue(-1));
    IssueIPC.onSelectPrevUnreadIssue(() => this.handleSelectNextPrevIssue(-1, true));
    IssueIPC.onToggleRead(() => this.handleToggleRead(this.state.selectedIssue));
    IssueIPC.onToggleArchive(() => this.handleToggleArchive(this.state.selectedIssue));
    IssueIPC.onToggleMark(() => this.handleToggleMark(this.state.selectedIssue));
    IssueIPC.onFilterToggleUnread(() => this.handleToggleFilter('is:unread'));
    IssueIPC.onFilterToggleOpen(() => this.handleToggleFilter('is:open'));
    IssueIPC.onFilterToggleMark(() => this.handleToggleFilter('is:star'));
    IssueIPC.onFilterToggleAuthor(() => this.handleToggleFilter(`author:${ConfigRepo.getLoginName()}`));
    IssueIPC.onFilterToggleAssignee(() => this.handleToggleFilter(`assignee:${ConfigRepo.getLoginName()}`));
    IssueIPC.onClearFilter(() => this.handleExecFilterQuery(''));
    IssueIPC.onOpenIssueWithExternalBrowser(() => this.state.selectedIssue && shell.openExternal(this.state.selectedIssue.html_url));

    this.setupBrowserViewScroll();
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private setupBrowserViewScroll() {
    // hack: tabIndexをつけると、keydownを取れる
    (ReactDOM.findDOMNode(this) as HTMLElement).tabIndex = 0;
    (ReactDOM.findDOMNode(this) as HTMLElement).addEventListener('keydown', (ev) => {
      if (ev.code === 'Space') {
        WebViewEvent.emitScroll(ev.shiftKey ? -1 : 1);
      }
    });
  }

  private async loadIssues() {
    if (this.lock) return;
    if (!this.state.stream) return;
    if (this.state.end) return;

    const stream = this.state.stream;
    let streamId;
    switch(stream.type) {
      case 'stream': streamId = stream.id; break;
      case 'filteredStream': streamId = (stream as FilteredStreamEntity).stream_id; break;
      case 'libraryStream': streamId = null; break;
      case 'systemStream': streamId = stream.id; break;
      default: console.error(`unknown stream type. type = ${stream.type}`); return;
    }

    const page = this.state.page + 1;

    const filters = [
      stream.defaultFilter,
      this.state.filterQuery,
      this.state.sortQuery,
    ];
    if (ConfigRepo.getConfig().general.onlyUnreadIssue) filters.push('is:unread');

    this.setState({loading: true});
    this.lock = true;
    const {error, issues} = await IssueRepo.getIssuesInStream(streamId, filters.join(' '), '', page);
    this.lock = false;
    this.setState({loading: false});

    if (error) return console.error(error);

    const end = issues.length === 0;

    if (page === 0) {
      this.scrollView.scrollTop();
      this.setState({issues, page, end});
    } else {
      const allIssues = [...this.state.issues, ...issues];
      this.setState({issues: allIssues, page, end});
    }
  }

  private handleReloadIssuesWithUnselectIssue() {
    this.setState({page: -1, end: false, selectedIssue: null, updatedIssueIds: []}, () => {
      this.loadIssues();
    });
  }

  private async handleReloadWithUpdatedIssueIds() {
    const fadeInIssueIds = this.state.updatedIssueIds;
    this.setState({page: -1, issues: [], updatedIssueIds: []}, async () => {
      await this.loadIssues();
      this.setState({fadeInIssueIds});
      await TimerUtil.sleep(1000);
      this.setState({fadeInIssueIds: []});
    });
  }

  private handleLoadMore() {
    this.loadIssues();
  }

  private handleUpdateIssue(updatedIssue: IssueEntity) {
    const issues = this.state.issues.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue);
    this.setState({issues});
  }

  private async handleSelectIssue(targetIssue: IssueEntity) {
    this.setState({selectedIssue: targetIssue});

    const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, new Date());
    if (error) return console.error(error);

    const issues = this.state.issues.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue);
    this.setState({issues});

    IssueEvent.emitReadIssue(updatedIssue);
    IssueEvent.emitSelectIssue(updatedIssue, targetIssue.read_body);
  }

  private async handleSelectNextPrevIssue(direction: 1 | -1, skipReadIssue?) {
    if (!this.state.issues.length) return;

    // まだissueが選択されていない場合、最初のissueを選択状態にする
    if (!this.state.selectedIssue) {
      await this.handleSelectIssue(this.state.issues[0]);
      return;
    }

    const currentIndex = this.state.issues.findIndex(issue => issue.id === this.state.selectedIssue.id);
    if (currentIndex < 0) return;

    let targetIndex;
    if (skipReadIssue) {
      targetIndex = this.state.issues.findIndex((issue, index) => {
        if (index === currentIndex) return false;
        if (IssueRepo.isRead(issue)) return false;

        if (direction > 0) {
          return index > currentIndex;
        } else {
          return index < currentIndex;
        }
      });
    } else {
      targetIndex = currentIndex + direction;
    }

    if (this.state.issues[targetIndex]) {
      await this.handleSelectIssue(this.state.issues[targetIndex]);
    }
  }

  private handleExecFilterQuery(filterQuery: string) {
    this.setState({filterQuery, page: -1, end: false}, () => this.loadIssues());
  }

  private handleExecSortQuery(sortQuery: SortQueryEntity) {
    this.setState({sortQuery, page: -1, end: false}, () => this.loadIssues());
  }

  private handleToggleFilter(filter: string) {
    const regExp = new RegExp(` *${filter} *`);
    const matched = this.state.filterQuery.match(regExp);
    let filterQuery: string;
    if (matched) {
      filterQuery = this.state.filterQuery.replace(regExp, ' ').trim();
    } else {
      filterQuery = `${this.state.filterQuery} ${filter}`;
    }

    this.setState({filterQuery, end: false, page: -1, selectedIssue: null, updatedIssueIds: []}, () => {
      this.loadIssues();
    });
  }

  private handleToggleFilterIssueType(issue: IssueEntity) {
    const filter = `is:${issue.type} is:${issue.closed_at ? 'closed' : 'open'}`;
    this.handleToggleFilter(filter);
  }

  private handleFilterMilestone(issue: IssueEntity) {
    const milestone = issue.value.milestone.title;
    let filter: string;
    if (milestone.includes(' ')) {
      filter = `milestone:"${milestone}"`;
    } else {
      filter = `milestone:${milestone}`;
    }
    this.handleToggleFilter(filter);
  }

  private handleFilterLabel(_issue: IssueEntity, label: string) {
    let filter: string;
    if (label.includes(' ')) {
      filter = `label:"${label}"`;
    } else {
      filter = `label:${label}`;
    }
    this.handleToggleFilter(filter);
  }

  private handleFilterAuthor(issue: IssueEntity) {
    this.handleToggleFilter(`author:${issue.author}`);
  }

  private handleFilterAssignee(_issue: IssueEntity, assignee: string) {
    this.handleToggleFilter(`assignee:${assignee}`);
  }

  private handleFilterRepoOrg(issue: IssueEntity) {
    this.handleToggleFilter(`org:${issue.user}`);
  }

  private handleFilterRepoName(issue: IssueEntity) {
    this.handleToggleFilter(`repo:${issue.repo}`);
  }

  private handleFilterIssueNumber(issue: IssueEntity) {
    this.handleToggleFilter(`number:${issue.number}`);
  }

  private async handleToggleMark(targetIssue: IssueEntity | null) {
    if (!targetIssue) return;

    const date = targetIssue.marked_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateMark(targetIssue.id, date);
    if (error) return console.error(error);

    this.handleUpdateIssue(updatedIssue);

    if (this.state.selectedIssue?.id === updatedIssue.id) this.setState({selectedIssue: updatedIssue});

    IssueEvent.emitMarkIssue(updatedIssue);
  }

  private async handleToggleRead(targetIssue: IssueEntity | null) {
    if (!targetIssue) return;

    const date = IssueRepo.isRead(targetIssue) ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, date);
    if (error) return console.error(error);

    this.handleUpdateIssue(updatedIssue);

    if (this.state.selectedIssue?.id === updatedIssue.id) this.setState({selectedIssue: updatedIssue});

    IssueEvent.emitReadIssue(updatedIssue);
  }

  private async handleToggleArchive(targetIssue: IssueEntity | null) {
    if (!targetIssue) return;

    const date = targetIssue.archived_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateArchive(targetIssue.id, date);
    if (error) return console.error(error);

    const issues = this.state.issues.filter(issue => issue.id !== updatedIssue.id);
    this.setState({issues});

    if (this.state.selectedIssue?.id === updatedIssue.id) this.setState({selectedIssue: updatedIssue});

    IssueEvent.emitArchiveIssue(updatedIssue);
  }

  private async handleUnsubscribe(targetIssue: IssueEntity) {
    const url = targetIssue.value.html_url;
    const {error} = await SubscriptionIssuesRepo.unsubscribe(url);
    if (error) return console.error(error);

    const issues = this.state.issues.filter(issue => issue.id !== targetIssue.id);
    this.setState({issues});

    await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
    SystemStreamEvent.emitRestartAllStreams();
  }

  private async handleReadAll() {
    if (confirm(`Would you like to mark "${this.state.stream.name}" all as read?`)) {

      const stream = this.state.stream;
      let streamId;
      const filters = [stream.defaultFilter];
      switch(stream.type) {
        case 'stream':
          streamId = stream.id;
          break;
        case 'filteredStream':
          streamId = (stream as FilteredStreamEntity).stream_id;
          filters.push((stream as FilteredStreamEntity).filter);
          break;
        case 'libraryStream':
          streamId = null;
          break;
        case 'systemStream':
          streamId = stream.id;
          break;
        default: console.error(`unknown stream type. type = ${stream.type}`); return;
      }

      const {error} = await IssueRepo.updateReadAll(streamId, filters.join(' '));
      if (error) return console.error(error);

      this.setState({page: -1}, async () => {
        await this.loadIssues();
        IssueEvent.emitReadAllIssues(streamId);
      });
    }
  }

  private async handleReadCurrent() {
    if (confirm('Would you like to mark current issues as read?')) {
      const issueIds = this.state.issues.map(issue => issue.id);
      const {error, issues} = await IssueRepo.updateReads(issueIds, new Date());
      if (error) return console.error(error);

      this.setState({issues});
      IssueEvent.emitReadIssues(issueIds);
    }
  }

  render() {
    const loadingClassName = this.state.loading && this.state.page === -1 ? 'issues-first-page-loading' : '';
    return (
      <Root
        className={`${loadingClassName} ${this.props.className}`}
        ref={ref => this.scrollView = ref}
        onEnd={() => this.handleLoadMore()}
        horizontalResizable={true}
        style={{height: '100%'}}
      >
        {this.renderFilter()}
        {this.renderSort()}
        {this.renderUpdatedBanner()}
        {this.renderIssues()}
        {this.renderLoading()}
      </Root>
    );
  }

  private renderFilter() {
    return (
      <IssueFilterFragment
        filterQuery={this.state.filterQuery}
        onExec={filterQuery => this.handleExecFilterQuery(filterQuery)}
      />
    );
  }

  private renderSort() {
    return (
      <IssueSortFragment
        sortQuery={this.state.sortQuery}
        onExec={sortQuery => this.handleExecSortQuery(sortQuery)}
      />
    );
  }

  private renderUpdatedBanner() {
    return (
      <IssueUpdatedBannerFragment
        stream={this.state.stream}
        filter={this.state.filterQuery}
        updatedIssueIds={this.state.updatedIssueIds}
        onChange={updatedIssueIds => this.setState({updatedIssueIds})}
        onClick={() => this.handleReloadWithUpdatedIssueIds()}
      />
    );
  }

  private renderIssues() {
    return this.state.issues.map(issue => {
      const fadeIn = this.state.fadeInIssueIds.includes(issue.id);
      const selected = issue.id === this.state.selectedIssue?.id;

      let onUnsubscribe = null;
      if (this.state.stream.id === SystemStreamId.subscription) {
        onUnsubscribe = (issue: IssueEntity) => this.handleUnsubscribe(issue);
      }

      return (
        <IssueRow
          key={issue.id}
          issue={issue}
          selected={selected}
          fadeIn={fadeIn}
          className='issue-row'
          skipHandlerSameCheck={true}
          onSelect={issue => this.handleSelectIssue(issue)}
          onToggleIssueType={issue => this.handleToggleFilterIssueType(issue)}
          onToggleMilestone={issue => this.handleFilterMilestone(issue)}
          onToggleLabel={(issue, label) => this.handleFilterLabel(issue, label)}
          onToggleAuthor={issue => this.handleFilterAuthor(issue)}
          onToggleAssignee={(issue, assignee) => this.handleFilterAssignee(issue, assignee)}
          onToggleRepoOrg={issue => this.handleFilterRepoOrg(issue)}
          onToggleRepoName={issue => this.handleFilterRepoName(issue)}
          onToggleIssueNumber={issue => this.handleFilterIssueNumber(issue)}
          onToggleMark={issue => this.handleToggleMark(issue)}
          onToggleArchive={issue => this.handleToggleArchive(issue)}
          onToggleRead={issue => this.handleToggleRead(issue)}
          onReadAll={() => this.handleReadAll()}
          onReadCurrentAll={() => this.handleReadCurrent()}
          onUnsubscribe={onUnsubscribe}
        />
      );
    });
  }

  private renderLoading() {
    const show = this.state.loading && this.state.page > -1;
    return <Loading show={show}/>;
  }
}

const Root = styled(ScrollView)`
  width: 300px;
  height: 100%;
  background: ${() => appTheme().issuesBg};
  border-right: solid ${border.medium}px ${() => appTheme().borderColor};
  
  &.issues-first-page-loading .issue-row {
    opacity: 0.3;
  }
`;
