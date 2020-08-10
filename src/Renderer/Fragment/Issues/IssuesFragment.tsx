import {clipboard, ipcRenderer, shell} from 'electron';
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
import {FilterFragment} from './FilterFragment';
import {IssueEntity} from '../../Type/IssueEntity';
import styled from 'styled-components';
import {IssueRow} from '../../Component/IssueRow';
import {ContextMenuType} from '../../Component/Core/ContextMenu';
import {UpdatedBannerFragment} from './UpdatedBannerFragment';
import {TimerUtil} from '../../Util/TimerUtil';
import {ScrollView} from '../../Component/Core/ScrollView';
import {Loading} from '../../Component/Loading';
import {appTheme} from '../../Style/appTheme';
import {View} from '../../Component/Core/View';
import {SortQueryBox, SortQueryEntity} from '../../Component/SortQueryBox';

type Props = {
}

type State = {
  stream: BaseStreamEntity;
  filterQuery: string;
  sortQuery: SortQueryEntity;
  page: number;
  issues: IssueEntity[];
  hasNextPage: boolean;
  totalCount: number;
  selectedIssue: IssueEntity;
  loading: boolean;
  updatedIssueIds: number[];
  fadeInIssueIds: number[];
}

// todo: コマンド
export class IssuesFragment extends React.Component<Props, State> {
  state: State = {
    stream: null,
    filterQuery: '',
    sortQuery: 'sort:updated',
    page: -1,
    issues: [],
    hasNextPage: true,
    totalCount: 0,
    selectedIssue: null,
    loading: false,
    updatedIssueIds: [],
    fadeInIssueIds: [],
  };

  private scrollView: ScrollView;
  private lock: boolean = false;

  componentDidMount() {
    SystemStreamEvent.onSelectStream(this, (stream)=>{
      this.setState({stream, page: -1, hasNextPage: true, totalCount: 0, filterQuery: '', selectedIssue: null, updatedIssueIds: []}, () => {
        this.loadIssues();
      });
    });

    StreamEvent.onSelectStream(this, (stream, filteredStream)=>{
      const targetStream = stream || filteredStream;
      this.setState({stream: targetStream, page: -1, hasNextPage: true, totalCount: 0, filterQuery: filteredStream?.filter || '', selectedIssue: null, updatedIssueIds: []}, () => {
        this.loadIssues();
      });
    });

    LibraryStreamEvent.onSelectStream(this, async streamName => {
      const {error, libraryStream} = await LibraryStreamRepo.getLibraryStream(streamName);
      if (error) return console.error(error);
      this.setState({stream: libraryStream, page: -1, hasNextPage: true, totalCount: 0, filterQuery: '', selectedIssue: null, updatedIssueIds: []}, () => {
        this.loadIssues();
      });
    });

    // IssueEvent.onReadAllIssues(this, this._loadIssues.bind(this));
    // IssueEvent.onReadAllIssuesFromLibrary(this, this._loadIssues.bind(this));
    // IssueEvent.onFocusIssue(this, this._handleClick.bind(this));
    // IssueEvent.onReadIssue(this, this._updateSingleIssue.bind(this));
    // IssueEvent.onMarkIssue(this, this._updateSingleIssue.bind(this));
    // IssueEvent.addArchiveIssueListener(this, this._updateSingleIssue.bind(this));

    // todo: Event化する
    ipcRenderer.on('command-issues', (_ev, commandItem)=>{
      this.handleCommand(commandItem);
    });

    // hack: tabIndexをつけると、keydownを取れる
    ReactDOM.findDOMNode(this).tabIndex = 0;
    ReactDOM.findDOMNode(this).addEventListener('keydown', (ev) => {
      if (ev.code === 'Space') {
        WebViewEvent.emitScroll(ev.shiftKey ? -1 : 1);
      }
    });
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadIssues() {
    if (this.lock) return;
    if (!this.state.stream) return;
    if (!this.state.hasNextPage) return;

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
    const {error, issues, totalCount, hasNextPage} = await IssueRepo.getIssuesInStream(streamId, filters.join(' '), '', page);
    this.lock = false;
    this.setState({loading: false});

    if (error) return console.error(error);

    if (page === 0) {
      this.scrollView.scrollTop();
      this.setState({issues, page, hasNextPage, totalCount});
    } else {
      const allIssues = [...this.state.issues, ...issues];
      this.setState({issues: allIssues, page, hasNextPage, totalCount});
    }
  }

  private async handleReloadWithUpdatedIssueIds() {
    const fadeInIssueIds = this.state.updatedIssueIds;
    this.setState({page: -1, updatedIssueIds: []}, async () => {
      await this.loadIssues();
      this.setState({fadeInIssueIds});
      await TimerUtil.sleep(1000);
      this.setState({fadeInIssueIds: []});
    });
  }

  private handleLoadMore() {
    this.loadIssues();
  }

  private async handleSelectIssue(targetIssue: IssueEntity) {
    this.setState({selectedIssue: targetIssue});

    const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, new Date());
    if (error) return console.error(error);

    const issues = this.state.issues.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue);
    this.setState({issues});

    IssueEvent.emitReadIssue(updatedIssue);
    IssueEvent.emitSelectIssue(updatedIssue, updatedIssue.read_body);
  }

  private async handleSelectUpDownIssue(direction: 1 | -1, skipReadIssue?) {
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
    this.setState({filterQuery, page: -1, hasNextPage: true}, () => this.loadIssues());
  }

  private handleExecSortQuery(sortQuery: SortQueryEntity) {
    this.setState({sortQuery, page: -1, hasNextPage: true}, () => this.loadIssues());
  }

  private handleFilterIssueType(issue: IssueEntity) {
    console.log('issue type', issue);
  }

  private handleFilterMilestone(issue: IssueEntity) {
    console.log('milestone', issue);
  }

  private handleFilterLabel(issue: IssueEntity, label: string) {
    console.log('label', issue, label);
  }

  private handleFilterAuthor(issue: IssueEntity) {
    console.log('author', issue);
  }

  private handleFilterAssignee(issue: IssueEntity, assignee: string) {
    console.log('assignee', issue, assignee);
  }

  private handleFilterRepoOrg(issue: IssueEntity) {
    console.log('repo org', issue);
  }

  private handleFilterRepoName(issue: IssueEntity) {
    console.log('repo name', issue);
  }

  private handleFilterIssueNumber(issue: IssueEntity) {
    console.log('issue number', issue);
  }

  private async handleToggleBookmark(targetIssue: IssueEntity) {
    const date = targetIssue.marked_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateMark(targetIssue.id, date);
    if (error) return console.error(error);

    const issues = this.state.issues.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue);
    this.setState({issues});

    IssueEvent.emitMarkIssue(updatedIssue);
  }

  private async handleToggleRead(targetIssue: IssueEntity) {
    const date = IssueRepo.isRead(targetIssue) ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateRead(targetIssue.id, date);
    if (error) return console.error(error);

    const issues = this.state.issues.map(issue => issue.id === updatedIssue.id ? updatedIssue : issue);
    this.setState({issues});

    IssueEvent.emitReadIssue(updatedIssue);
  }

  private async handleToggleArchive(targetIssue: IssueEntity) {
    const date = targetIssue.archived_at ? null : new Date();
    const {error, issue: updatedIssue} = await IssueRepo.updateArchive(targetIssue.id, date);
    if (error) return console.error(error);

    const issues = this.state.issues.filter(issue => issue.id !== updatedIssue.id);
    this.setState({issues});

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

  // private handleCreateFilteredStream() {
  //   // this.state.stream.id, this.state.filter
  // }

  private handleOpenIssueURL(issue: IssueEntity) {
    shell.openExternal(issue.value.html_url);
  }

  private handleCopyIssueURL(issue: IssueEntity) {
    clipboard.writeText(issue.value.html_url);
  }

  private handleCommand(commandItem) {
    const command = commandItem.command;
    switch (command) {
      case 'load':
        this.loadIssues();
        break;
      case 'next':
        this.handleSelectUpDownIssue(1);
        break;
      case 'prev':
        this.handleSelectUpDownIssue(-1);
        break;
      case 'next_with_skip':
        this.handleSelectUpDownIssue(1, true);
        break;
      case 'prev_with_skip':
        this.handleSelectUpDownIssue(-1, true);
        break;
        // todo: FilterFragmentでやる
      // case 'focus_filter':
      //   ReactDOM.findDOMNode(this).querySelector('#filterInput').focus();
      //   break;
      case 'filter_unread':
        this.handleExecFilterQuery('is:unread');
        break;
      case 'filter_open':
        this.handleExecFilterQuery('is:open');
        break;
      case 'filter_mark':
        this.handleExecFilterQuery('is:star');
        break;
      case 'filter_author':
        this.handleExecFilterQuery(`author:${ConfigRepo.getLoginName()}`);
        break;
      case 'filter_assignee':
        this.handleExecFilterQuery(`assignee:${ConfigRepo.getLoginName()}`);
        break;
      case 'filter_clear':
        this.handleExecFilterQuery('');
        break;
    }
  }

  render() {
    const loadingClassName = this.state.loading && this.state.page === -1 ? 'issues-first-page-loading' : '';
    return (
      <Root className={loadingClassName}>
        <ScrollView
          ref={ref => this.scrollView = ref}
          onEnd={() => this.handleLoadMore()}
          style={{height: '100%'}}
        >
          {this.renderFilter()}
          {this.renderSort()}
          {this.renderUpdatedBanner()}
          {this.renderIssues()}
          {this.renderLoading()}
        </ScrollView>
      </Root>
    );
  }

  private renderFilter() {
    return (
      <FilterFragment
        filterQuery={this.state.filterQuery}
        onExec={filterQuery => this.handleExecFilterQuery(filterQuery)}
      />
    );
  }

  private renderSort() {
    return (
      <SortQueryBox
        sortQuery={this.state.sortQuery}
        onExec={sortQuery => this.handleExecSortQuery(sortQuery)}
      />
    );
  }

  private renderUpdatedBanner() {
    return (
      <UpdatedBannerFragment
        stream={this.state.stream}
        filter={this.state.filterQuery}
        updatedIssueIds={this.state.updatedIssueIds}
        onChange={updatedIssueIds => this.setState({updatedIssueIds})}
        onClick={() => this.handleReloadWithUpdatedIssueIds()}
      />
    );
  }

  private renderIssues() {
    return this.state.issues.map((issue, index) => {
      // create menu
      const hideUnsubscribe = this.state.stream.id !== SystemStreamId.subscription;
      // const hideCreateFilter = this.state.stream.type !== 'stream';
      const menus: ContextMenuType[] = [
        {label: 'Toggle Read and Unread', handler: () => this.handleToggleRead(issue)},
        {label: 'Toggle Archive', handler: () => this.handleToggleArchive(issue)},
        {label: 'Unsubscribe', handler: () => this.handleUnsubscribe(issue), hide: hideUnsubscribe},
        {type: 'separator'},
        {label: 'Mark Current as Read', handler: () => this.handleReadCurrent()},
        {label: 'Mark All as Read', handler: () => this.handleReadAll()},
        {type: 'separator'},
        // todo:
        // {label: 'Create Filtered Stream', handler: () => this.handleCreateFilteredStream(), hide: hideCreateFilter},
        // {type: 'separator', hide: hideCreateFilter},
        {label: 'Open with Browser', handler: () => this.handleOpenIssueURL(issue)},
        {label: 'Copy URL', handler: () => this.handleCopyIssueURL(issue)},
      ];

      const fadeIn = this.state.fadeInIssueIds.includes(issue.id);
      const selected = issue.id === this.state.selectedIssue?.id;

      return (
        <IssueRow
          key={index}
          issue={issue}
          menus={menus}
          selected={selected}
          fadeIn={fadeIn}
          className='issue-row'
          onSelect={issue => this.handleSelectIssue(issue)}
          onIssueType={issue => this.handleFilterIssueType(issue)}
          onMilestone={issue => this.handleFilterMilestone(issue)}
          onLabel={(issue, label) => this.handleFilterLabel(issue, label)}
          onAuthor={issue => this.handleFilterAuthor(issue)}
          onAssignee={(issue, assignee) => this.handleFilterAssignee(issue, assignee)}
          onRepoOrg={issue => this.handleFilterRepoOrg(issue)}
          onRepoName={issue => this.handleFilterRepoName(issue)}
          onIssueNumber={issue => this.handleFilterIssueNumber(issue)}
          onToggleBookmark={issue => this.handleToggleBookmark(issue)}
        />
      );
    });
  }

  private renderLoading() {
    const show = this.state.loading && this.state.page > -1;
    return <Loading show={show}/>;
  }
}

const Root = styled(View)`
  width: 300px;
  background: ${() => appTheme().issuesBg};
  
  &.issues-first-page-loading .issue-row {
    opacity: 0.3;
  }
`;

// @ts-ignore
export class _IssuesFragment extends React.Component<Props, State> {
  // state: State = {
  //   issues: [],
  //   waitForLoadingIssueIds: [],
  //   fadeInIssueIds: [],
  //   // filterHistories: []
  // };
  //
  // private _streamId: number = null;
  // private _streamName: string = null;
  // private _libraryStreamName: string = null;
  // private _nowLoadingIssues = false;
  // private _filterSelection = 'updated';

  // private _pageNumber = 0;
  // private _totalCount = 0;
  // private _hasNextPage = false;

  // private _currentIssueId: number = null;
  // private _filterQuery: string = null;

  // private _handlingViKey = false;
  // async _handleViKey(direction, skipReadIssue?) {
  //   if (this._handlingViKey) return;
  //   if (!this._currentIssueId) {
  //     const issue = this.state.issues[0];
  //     const el = ReactDOM.findDOMNode(this).querySelector('.issue-list-item');
  //     if (issue && el) this._handleClick(issue, {currentTarget: el});
  //     return;
  //   }
  //
  //   this._handlingViKey = true;
  //   const issueId = this._currentIssueId;
  //   const issues = this.state.issues;
  //   const index = issues.findIndex((_issue) => _issue.id === issueId);
  //   let nextIndex;
  //   if (skipReadIssue) {
  //     nextIndex = issues.findIndex((_issue, _index) => {
  //       if (IssueRepo.isRead(_issue)) return false;
  //
  //       if (direction > 0) {
  //         return _index > index;
  //       } else {
  //         return _index < index;
  //       }
  //     });
  //   } else {
  //     nextIndex = index + direction;
  //   }
  //
  //   if (issues[nextIndex]) {
  //     const currentEl = ReactDOM.findDOMNode(this).querySelector('li.active');
  //     currentEl.classList.remove('active');
  //     const nextEl = currentEl.parentElement.querySelectorAll('.issue-list-item')[nextIndex];
  //     nextEl.classList.add('active');
  //     nextEl.scrollIntoViewIfNeeded(false);
  //
  //     await this._handleClick(issues[nextIndex]);
  //   } else {
  //     const pagingResult = await this._handlePager(direction, direction === -1);
  //     if (!pagingResult || this.state.issues.length === 0) {
  //       this._handlingViKey = false;
  //       return;
  //     }
  //     const nextIssue = direction === 1 ? this.state.issues[0] : this.state.issues[this.state.issues.length - 1];
  //     await this._handleClick(nextIssue);
  //   }
  //
  //   this._handlingViKey = false;
  // }
  //
  // _handleWebViewScroll(ev) {
  //   if (!ev.target.classList.contains('issues')) return;
  //   if (!this._currentIssueId) return;
  //
  //   if (ev.keyCode === 32) {
  //     WebViewEvent.emitScroll(ev.shiftKey ? -1 : 1);
  //     ev.preventDefault();
  //   }
  // }
  // _handleAvatar(result, evt) {
  //   const img = evt.target;
  //   if (result === 'error') {
  //     img.style.display = 'none';
  //   } else if (result === 'success') {
  //     img.style.display = null;
  //   }
  // }
  //
  _handleFilterSameAs(key, value, evt) {
    // evt.stopPropagation();
    //
    // if (typeof value === 'string' && value.includes(' ')) value = `"${value}"`;
    const queryPart = `${key}:${value}`;
    let query;
    if (evt.metaKey || evt.ctrlKey) { // replace
      query = queryPart;
    } else if (evt.shiftKey) { // remove
      query = this._filterQuery.replace(new RegExp(` *${queryPart} *`, 'g'), '');
    } else { // append
      if (!this._filterQuery) {
        query = queryPart;
      }
      else if (this._filterQuery.match(new RegExp(` *${queryPart} *`))) {
        query = this._filterQuery;
      } else {
        query = `${this._filterQuery} ${queryPart}`;
      }
    }
    // ReactDOM.findDOMNode(this).querySelector('#filterInput').value = query;
    // this._pageNumber = 0;
    // this._filterQuery = query;
    // this._loadIssues();
  }

  // _handleCommand(commandItem) {
  //   const command = commandItem.command;
  //   switch (command) {
  //     case 'load':
  //       this._loadIssues();
  //       break;
  //     case 'next':
  //       this._handleViKey(1);
  //       break;
  //     case 'prev':
  //       this._handleViKey(-1);
  //       break;
  //     case 'next_with_skip':
  //       this._handleViKey(1, true);
  //       break;
  //     case 'prev_with_skip':
  //       this._handleViKey(-1, true);
  //       break;
  //     case 'focus_filter':
  //       ReactDOM.findDOMNode(this).querySelector('#filterInput').focus();
  //       break;
  //     case 'filter_unread':
  //       this._execFilter('is:unread');
  //       break;
  //     case 'filter_open':
  //       this._execFilter('is:open');
  //       break;
  //     case 'filter_mark':
  //       this._execFilter('is:star');
  //       break;
  //     case 'filter_author':
  //       this._execFilter(`author:${ConfigRepo.getLoginName()}`);
  //       break;
  //     case 'filter_assignee':
  //       this._execFilter(`assignee:${ConfigRepo.getLoginName()}`);
  //       break;
  //     case 'filter_clear':
  //       this._execFilter('');
  //       break;
  //   }
  // }
  // componentDidMount() {
    // SystemStreamEvent.onSelectStream(this, (stream)=>{
    //   this._streamName = stream.name;
    //   this._streamId = stream.id;
    //   this._libraryStreamName = null;
    //   this._currentIssueId = null;
    //   this._pageNumber = 0;
    //   this._filterQuery = null;
    //   ReactDOM.findDOMNode(this).querySelector('#filterInput').value = '';
    //   this._loadIssues();
    // });
    // SystemStreamEvent.onUpdateStream(this, (streamId, updateIssueIds)=>{
    //   this._mergeWaitForLoadingIssueIds('system', streamId, updateIssueIds);
    // });
    //
    // StreamEvent.onSelectStream(this, (stream, filteredStream)=>{
    //   const filter = filteredStream ? filteredStream.filter : null;
    //   this._streamName = stream.name;
    //   this._streamId = stream.id;
    //   this._libraryStreamName = null;
    //   this._currentIssueId = null;
    //   this._pageNumber = 0;
    //   this._filterQuery = filter;
    //   ReactDOM.findDOMNode(this).querySelector('#filterInput').value = filter;
    //   this._loadIssues();
    // });
    // StreamEvent.onUpdateStream(this, (streamId, updateIssueIds)=>{
    //   this._mergeWaitForLoadingIssueIds('stream', streamId, updateIssueIds);
    // });
    //
    // LibraryStreamEvent.onSelectStream(this, streamName => {
    //   this._streamName = streamName;
    //   this._streamId = null;
    //   this._libraryStreamName = streamName;
    //   this._currentIssueId = null;
    //   this._pageNumber = 0;
    //   this._filterQuery = null;
    //   // ReactDOM.findDOMNode(this).querySelector('#filterInput').value = '';
    //   this._loadIssues();
    // });
    // LibraryStreamEvent.onUpdateStream(this, (streamName, updateIssueIds) => {
    //   this._mergeWaitForLoadingIssueIds('library', streamName, updateIssueIds);
    // });
    //
    // IssueEvent.onReadAllIssues(this, this._loadIssues.bind(this));
    // IssueEvent.onReadAllIssuesFromLibrary(this, this._loadIssues.bind(this));
    // IssueEvent.onFocusIssue(this, this._handleClick.bind(this));
    // IssueEvent.onReadIssue(this, this._updateSingleIssue.bind(this));
    // IssueEvent.onMarkIssue(this, this._updateSingleIssue.bind(this));
    // IssueEvent.addArchiveIssueListener(this, this._updateSingleIssue.bind(this));
    //
    // electron.ipcRenderer.on('command-issues', (_ev, commandItem)=>{
    //   this._handleCommand(commandItem);
    // });
    //
    // hack: React onKeyDown can not handle shift + space key.
    // ReactDOM.findDOMNode(this).addEventListener('keydown', this._handleWebViewScroll.bind(this));
    //
    // hack
    // this._initHandleFilterQuery();
  // }
  //
  // componentWillUnmount() {
  //   StreamEvent.offAll(this);
  //   SystemStreamEvent.offAll(this);
  //   LibraryStreamEvent.offAll(this);
  //   IssueEvent.offAll(this);
  // }
  //
  // async _loadIssues() {
    // if (this._nowLoadingIssues) {
    //   return;
    // }
    //
    // this._nowLoadingIssues = true;
    //
    // // hack: DOM operation
    // const list = ReactDOM.findDOMNode(this).querySelector('#issuesList');
    // list.style.opacity = 0.3;
    //
    // let filterSelectionQuery;
    // switch (this._filterSelection) {
    //   case 'created': filterSelectionQuery = 'sort:created'; break;
    //   case 'updated': filterSelectionQuery = ''; break;
    //   case 'closed': filterSelectionQuery = 'sort:closed'; break;
    //   case 'read': filterSelectionQuery = 'sort:read'; break;
    //   case 'dueon': filterSelectionQuery = 'is:open sort:dueon'; break;
    //   default: filterSelectionQuery = '';
    // }
    //
    // let filterQuery;
    // if (this._filterQuery) {
    //   filterQuery = this._filterQuery + ` ${filterSelectionQuery}`;
    // } else {
    //   filterQuery = filterSelectionQuery;
    // }
    //
    // if (ConfigRepo.getConfig().general.onlyUnreadIssue) {
    //   filterQuery += ' is:unread';
    // }
    //
    // let defaultFilter;
    // if (this._streamId !== null) {
    //   if (this._streamId >= 0) {
    //     // todo: eventから渡ってきたstreamを使えば読み出さなくて良さそう
    //     const {error, stream} = await StreamRepo.getStream(this._streamId);
    //     if (error) return console.error(error);
    //     defaultFilter = stream.defaultFilter;
    //   } else {
    //     const {error, systemStream} = await SystemStreamRepo.getSystemStream(this._streamId);
    //     if (error) return console.error(error);
    //     defaultFilter = systemStream.defaultFilter;
    //   }
    // } else if (this._libraryStreamName) {
    //   const {error, libraryStream} = await LibraryStreamRepo.getLibraryStream(this._libraryStreamName);
    //   if (error) return console.error(error);
    //   defaultFilter = libraryStream.defaultFilter;
    // }
    //
    // const result = await IssueRepo.getIssuesInStream(this._streamId, defaultFilter, filterQuery, this._pageNumber);
    // if (result.error) return console.error(result.error);
    //
    // // hack: DOM operation
    // if (this._pageNumber === 0) {
    //   const container = ReactDOM.findDOMNode(this).parentElement;
    //   container.scrollTop = 0;
    // }
    //
    // this._totalCount = result.totalCount;
    // this._hasNextPage = result.hasNextPage;
    //
    // if (!result.issues.find((issue) => issue.id === this._currentIssueId)) {
    //   this._currentIssueId = null;
    // }
    //
    // this.setState({
    //   issues: result.issues,
    //   waitForLoadingIssueIds: [],
    //   fadeInIssueIds: this.state.waitForLoadingIssueIds
    // });
    //
    // // hack: DOM operation
    // list.style.opacity = null;
    //
    // this._nowLoadingIssues = false;
  // }
  //
  // async _mergeWaitForLoadingIssueIds(type, streamIdOrName, updatedIssueIds) {
  //   let ids;
  //   if (this._libraryStreamName && type === 'library' && this._libraryStreamName === streamIdOrName) {
  //     ids = updatedIssueIds;
  //   } else if (this._streamId !== null && this._streamId < 0) {
  //     // todo: eventから受け取ったstreamを使えるようにする
  //     const res = await SystemStreamRepo.getSystemStream(this._streamId);
  //     if (res.error) return console.error(res.error);
  //
  //     const {error, issueIds} = await IssueRepo.getIncludeIds(updatedIssueIds, this._streamId, res.systemStream.defaultFilter);
  //     if (error) return console.error(error);
  //     ids = issueIds;
  //   } else if (this._streamId !== null && this._streamId >= 0) {
  //     // todo: eventから受け取ったstreamを使えるようにする
  //     const res = await StreamRepo.getStream(this._streamId);
  //     if (res.error) return console.error(res.error);
  //
  //     const {error, issueIds} = await IssueRepo.getIncludeIds(updatedIssueIds, this._streamId, res.stream.defaultFilter, this._filterQuery);
  //     if (error) return console.error(error);
  //     ids = issueIds;
  //   } else {
  //     return;
  //   }
  //
  //   const waitForLoadingIssueIds = this.state.waitForLoadingIssueIds;
  //   for (const id of ids) {
  //     if (!waitForLoadingIssueIds.includes(id)) waitForLoadingIssueIds.push(id);
  //   }
  //
  //   this.setState({waitForLoadingIssueIds});
  // }
  //
  // async _markIssue(issue, ev) {
  //   GARepo.eventIssueMark(!issue.marked_at);
  //   ev.stopPropagation();
  //   const res = await IssueRepo.updateMark(issue.id, issue.marked_at ? null : new Date());
  //   if (res.error) return console.error(res.error);
  //
  //   IssueEvent.emitMarkIssue(res.issue);
  //   this._updateSingleIssue(res.issue);
  // }
  //
  // async _archiveIssue(issue) {
  //   GARepo.eventIssueArchive(!issue.archived_at);
  //   const date = issue.archived_at ? null : new Date();
  //   const res = await IssueRepo.updateArchive(issue.id, date);
  //   if (res.error) return console.error(res.error);
  //
  //   IssueEvent.emitArchiveIssue(res.issue);
  //   this._updateSingleIssue(res.issue);
  // }
  //
  // async _unreadIssue(issue) {
  //   const date = IssueRepo.isRead(issue) ? null : new Date();
  //   const res = await IssueRepo.updateRead(issue.id, date);
  //   if (res.error) return console.error(res.error);
  //   issue = res.issue;
  //   IssueEvent.emitReadIssue(issue);
  //   this._updateSingleIssue(issue);
  //   GARepo.eventIssueRead(false);
  //   return issue;
  // }
  //
  // async _readIssue(issue) {
  //   IssueEvent.emitSelectIssue(issue, issue.read_body);
  //   const res = await IssueRepo.updateRead(issue.id, new Date());
  //   if (res.error) return console.error(res.error);
  //   issue = res.issue;
  //   IssueEvent.emitReadIssue(issue);
  //   this._updateSingleIssue(issue);
  //   GARepo.eventIssueRead(true);
  //   return issue;
  // }
  //
  // _updateSingleIssue(issue) {
  //   const issues = this.state.issues;
  //   const index = issues.findIndex((_issue) => _issue.id === issue.id);
  //   if (index === -1) return;
  //   issues[index] = issue;
  //   this.setState({issues});
  // }
  //
  // async _unsubscribe(issue) {
  //   const url = issue.html_url;
  //   const {error} = await SubscriptionIssuesRepo.unsubscribe(url);
  //   if (error) return console.error(error);
  //   await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
  //   SystemStreamEvent.emitRestartAllStreams();
  //   await this._loadIssues();
  // }
  //
  // async _handleClick(issue, ev?) {
  //   // if (ev && (ev.shiftKey || ev.metaKey)) {
  //   //   electron.shell.openExternal(issue.html_url);
  //   //   return;
  //   // }
  //
  //   // // hack: dom operation
  //   // // クリックしてからすぐにissueのactive状態を切り替えるためにDOM操作してしまっている
  //   // if (ev) {
  //   //   const prevEl = ReactDOM.findDOMNode(this).querySelector('li.active');
  //   //   if(prevEl) prevEl.classList.remove('active');
  //   //   const el = ev.currentTarget;
  //   //   el.classList.add('active');
  //   // }
  //   //
  //   // this._currentIssueId = issue.id;
  //   // await this._readIssue(issue);
  // }
  //
  // _handleContextMenu(issue) {
    // const MenuItem = remote.MenuItem;
    // const clipboard = electron.clipboard;
    // const shell = electron.shell;
    //
    // const menu = new remote.Menu();
    // menu.append(new MenuItem({
    //   label: IssueRepo.isRead(issue) ? 'Mark as Unread' : 'Mark as Read',
    //   click: this._unreadIssue.bind(this, issue)
    // }));
    //
    // menu.append(new MenuItem({
    //   label: issue.archived_at ? 'UnArchive' : 'Archive',
    //   click: this._archiveIssue.bind(this, issue)
    // }));
    //
    // if (this._streamId === SystemStreamId.subscription) {
    //   menu.append(new MenuItem({ type: 'separator' }));
    //
    //   menu.append(new MenuItem({
    //     label: 'Unsubscribe',
    //     click: this._unsubscribe.bind(this, issue)
    //   }));
    // }
    //
    // mark current, mark all
    // {
      // menu.append(new MenuItem({ type: 'separator' }));
      //
      // menu.append(new MenuItem({
      //   label: 'Mark Current as Read',
      //   click: async ()=>{
      //     if (confirm('Would you like to mark current issues as read?')) {
      //       const issueIds = this.state.issues.map((issue) => issue.id);
      //       const {error} = await IssueRepo.updateReads(issueIds, new Date());
      //       if (error) return console.error(error);
      //       IssueEvent.emitReadIssues(issueIds);
      //       this._loadIssues();
      //       GARepo.eventIssueReadCurrent();
      //     }
      //   }
      // }));
      //
      // if (this._streamId !== null) {
      //   menu.append(new MenuItem({
      //     label: 'Mark All as Read',
      //     click: async ()=>{
      //       if (confirm(`Would you like to mark "${this._streamName}" all as read?`)) {
      //         // await IssueRepo.readAll(this._streamId);
      //         let stream: BaseStreamEntity;
      //         if (this._streamId >= 0) {
      //           const res = await StreamRepo.getStream(this._streamId);
      //           if (res.error) return console.error(res.error);
      //           stream = res.stream;
      //         } else {
      //           const res = await SystemStreamRepo.getSystemStream(this._streamId);
      //           if (res.error) return console.error(res.error);
      //           stream = res.systemStream;
      //         }
      //         const {error} = await IssueRepo.updateReadAll(this._streamId, stream.defaultFilter);
      //         if (error) return console.error(error);
      //         IssueEvent.emitReadAllIssues(this._streamId);
      //
      //         this._loadIssues();
      //         GARepo.eventIssueReadAll();
      //       }
      //     }
      //   }));
      // }
      //
    //   if (this._libraryStreamName) {
    //     menu.append(new MenuItem({
    //       label: 'Mark All as Read',
    //       click: async ()=>{
    //         if (confirm(`Would you like to mark "${this._streamName}" all as read?`)) {
    //           // const {error} = await IssueRepo.readAllFromLibrary(this._libraryStreamName);
    //           const res = await LibraryStreamRepo.getLibraryStream(this._libraryStreamName);
    //           if (res.error) return console.error(res.error);
    //
    //           const {error} = await IssueRepo.updateReadAll(null, res.libraryStream.defaultFilter);
    //           if (error) return console.error(error);
    //           IssueEvent.emitReadAllIssuesFromLibrary(this._libraryStreamName);
    //           this._loadIssues();
    //         }
    //       }
    //     }));
    //   }
    // }
    //
    // // create filter
    // if (this._filterQuery && this._streamId && this._streamId >= 0) {
    //   menu.append(new MenuItem({ type: 'separator' }));
    //   menu.append(new MenuItem({
    //     label: 'Create Filter',
    //     click: async ()=>{
    //       const {error, stream} = await StreamRepo.getStream(this._streamId);
    //       if (error) return console.error(error);
    //       StreamEvent.emitOpenFilteredStreamSetting(stream, this._filterQuery);
    //     }
    //   }));
    // }
    //
    // // open browser, copy link
    // {
    //   menu.append(new MenuItem({ type: 'separator' }));
    //
    //   menu.append(new MenuItem({
    //     label: 'Open Browser',
    //     click: ()=>{
    //       shell.openExternal(issue.value.html_url);
    //     }
    //   }));
    //
    //   menu.append(new MenuItem({
    //     label: 'Copy Link',
    //     click: ()=>{
    //       clipboard.writeText(issue.value.html_url);
    //     }
    //   }));
    // }
    //
    // menu.popup({window: remote.getCurrentWindow()});
  // }
  //
  // async _initHandleFilterQuery() {
  //   const filterInput = ReactDOM.findDOMNode(this).querySelector('#filterInput');
  //   filterInput.addEventListener('click', this._handleFilterQuery.bind(this));
  //   filterInput.addEventListener('keydown', this._handleFilterQuery.bind(this));
  //   filterInput.addEventListener('keyup', this._handleFilterQuery.bind(this));
  //   document.body.addEventListener('click',()=>{
  //     ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
  //     if (!filterInput.value && this._filterQuery) {
  //       this._filterQuery = '';
  //       this._loadIssues();
  //     }
  //   });
  //
  //   ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
  //   const {error, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
  //   if (error) return console.error(error);
  //   const filters = filterHistories.map(filterHistory => filterHistory.filter);
  //   this.setState({filterHistories: filters});
  // }
  //
  // // hack: フィルター履歴のインタラクション、複雑すぎる。これ簡単にできるのだろうか
  // async _handleFilterQuery(ev) {
  //   // load issues with filter query
  //   const loadIssues = async (filterQuery) => {
  //     this._filterQuery = filterQuery;
  //     this._pageNumber = 0;
  //     const {error: e1} = await FilterHistoryRepo.createFilterHistory(this._filterQuery);
  //     if (e1) return console.error(e1);
  //
  //     const {error: e2, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
  //     if (e2) return console.error(e2);
  //
  //     const filters = filterHistories.map(filterHistory => filterHistory.filter);
  //     this.setState({filterHistories: filters});
  //     ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
  //     this._loadIssues();
  //   };
  //
  //   // move filter histories focus with direction
  //   const moveFilterHistoriesFocus = (inputEl, direction)=>{
  //     // 下キーを押した時に履歴が表示されていなければ、再スタートして処理を終了する
  //     if (direction === 1) {
  //       const filterHistoriesEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories');
  //       if (filterHistoriesEl.classList.contains('hidden')) {
  //         //filterHistoriesEl.classList.remove('hidden');
  //         start(inputEl);
  //         return;
  //       }
  //     }
  //
  //     const activeEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories:not(.hidden) li.active');
  //     if (activeEl) {
  //       let el = activeEl;
  //       while(el) {
  //         el = direction === 1 ? el.nextElementSibling : el.previousElementSibling;
  //         if (el && !el.classList.contains('hidden')) break;
  //       }
  //
  //       if (el) {
  //         el.classList.add('active');
  //         activeEl.classList.remove('active');
  //         inputEl.value = el.textContent;
  //       }
  //     } else {
  //       const el = ReactDOM.findDOMNode(this).querySelector('#filterHistories:not(.hidden) li:not(.hidden)');
  //       if (el) {
  //         el.classList.add('active');
  //         inputEl.value = el.textContent;
  //       }
  //     }
  //   };
  //
  //   // deactive current active history
  //   const clearActive = ()=> {
  //     const currentEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories li.active');
  //     if (currentEl) currentEl.classList.remove('active');
  //   };
  //
  //   // change filter history element visibility
  //   const changeHistoryVisibility = (filterQuery) =>{
  //     const filterHistoriesEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories');
  //     filterHistoriesEl.classList.remove('hidden');
  //     const inputtingFilter = filterQuery;
  //     const els = ReactDOM.findDOMNode(this).querySelectorAll('#filterHistories li');
  //     for (const el of (Array.from(els) as HTMLElement[])) {
  //       if (el.textContent.includes(inputtingFilter)) {
  //         el.classList.remove('hidden');
  //       } else {
  //         el.classList.add('hidden');
  //         el.classList.remove('active');
  //       }
  //     }
  //   };
  //
  //   const start = async (inputEl) => {
  //     const filterHistoriesEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories');
  //     filterHistoriesEl.classList.remove('hidden');
  //
  //     const els = ReactDOM.findDOMNode(this).querySelectorAll('#filterHistories li');
  //     for (const el of Array.from(els as HTMLElement[])) el.classList.remove('hidden');
  //
  //     filterHistoriesEl.onclick = (ev)=>{
  //       loadIssues(ev.target.textContent);
  //       GARepo.eventIssueFilter();
  //     };
  //     filterHistoriesEl.onmousemove = (ev) => {
  //       if (ev.target === filterHistoriesEl) return;
  //
  //       const activeEl = filterHistoriesEl.querySelector('.active');
  //       if (activeEl) activeEl.classList.remove('active');
  //       ev.target.classList.add('active');
  //       inputEl.value = ev.target.textContent;
  //     };
  //   };
  //
  //   if (ev.type === 'click') {
  //     start(ev.currentTarget);
  //     ev.stopPropagation(); // see this._initHandleFilterQuery() document.body
  //   }
  //
  //   if (ev.type === 'keydown') {
  //     if (ev.keyCode === 13) { // enter
  //       loadIssues(ev.currentTarget.value);
  //       GARepo.eventIssueFilter();
  //       return;
  //     }
  //
  //     if (ev.keyCode === 27) { // esc
  //       ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
  //       return;
  //     }
  //
  //     if (ev.keyCode === 40 || ev.keyCode === 38) { // 40 = down, 38 = up
  //       ev.preventDefault();
  //       moveFilterHistoriesFocus(ev.currentTarget, ev.keyCode === 40 ? 1 : -1);
  //       return;
  //     }
  //
  //     clearActive();
  //   }
  //
  //   if (ev.type === 'keyup') {
  //     if (ev.keyCode === 40 || ev.keyCode === 38 || ev.keyCode === 13 || ev.keyCode === 27) return;
  //     changeHistoryVisibility(ev.currentTarget.value);
  //   }
  // }
  //
  // _handleFilterClear() {
  //   this._filterQuery = '';
  //   ReactDOM.findDOMNode(this).querySelector('#filterInput').value = '';
  //   this._loadIssues();
  // }
  //
  // async _handleFilterSelection(ev) {
  //   this._filterSelection = ev.target.value;
  //   await this._loadIssues();
  // }
  //
  // async _execFilter(query) {
  //   const el = ReactDOM.findDOMNode(this).querySelector('#filterInput');
  //   if (!query) { // clear
  //     el.value = '';
  //   } else if (el.value) { // add or remove
  //     let removed = false;
  //     if (el.value === query) {
  //       el.value = '';
  //       removed = true;
  //     } else {
  //       const patterns = [`${query} `,` ${query}`];
  //       for (const pattern of patterns) {
  //         if (el.value.includes(pattern)) {
  //           el.value = el.value.replace(pattern, '');
  //           removed = true;
  //           break;
  //         }
  //       }
  //     }
  //
  //     if (!removed) el.value += ` ${query}`;
  //   } else { // assign
  //     el.value = query;
  //   }
  //
  //   this._pageNumber = 0;
  //   this._filterQuery = el.value;
  //   return this._loadIssues();
  // }
  //
  // async _handlePager(direction, toBottom = false) {
  //   if (direction > 0 && this._hasNextPage) {
  //     this._pageNumber++;
  //   } else if(direction < 0 && this._pageNumber > 0){
  //     this._pageNumber--;
  //   } else {
  //     return false;
  //   }
  //
  //   await this._loadIssues();
  //   const el = ReactDOM.findDOMNode(this).parentElement;
  //   if (toBottom) {
  //     el.scrollTop = el.scrollHeight;
  //   } else {
  //     el.scrollTop = 0;
  //   }
  //
  //   return true;
  // }
  //
  // _handleWaitForLoadingCount() {
  //   this._loadIssues();
  // }
  //
  //
  // render() {
    // function typeIcon(issue) {
    //   if (issue.type === 'issue') {
    //     if (issue.closed_at === null) {
    //       return '../image/icon_issue_open.svg';
    //     } else {
    //       return '../image/icon_issue_close.svg';
    //     }
    //   } else {
    //     if (issue.closed_at === null) {
    //       return '../image/icon_pr_open.svg';
    //     } else {
    //       return '../image/icon_pr_close.svg';
    //     }
    //   }
    // }
    //
    // const issueNodes = this.state.issues.map((issue)=>{
      // const user = issue.user;
      // const repo = issue.repo;
      // const author = issue.value.user.avatar_url;
      // const authorName = issue.value.user.login;
      //
      // const active = this._currentIssueId === issue.id ? 'active' : '';
      // const isRead = IssueRepo.isRead(issue);
      // const read = isRead ? 'read-true' : 'read-false';
      // const updatedAt = DateUtil.localToString(new Date(issue.updated_at));
      // const fromNow = DateUtil.fromNow(new Date(issue.updated_at));
      //
      // const fadeIn = this.state.fadeInIssueIds.includes(issue.id) ? 'fade-in' : '';
      //
      // // labels
      // const labelNodes = issue.value.labels.map((label)=>{
      //   const style = {
      //     backgroundColor: `#${label.color}`,
      //     color: `#${ColorUtil.suitTextColor(label.color)}`
      //   };
      //   return <span
      //     key={label.id} style={style} title={label.name}
      //     onClick={this._handleFilterSameAs.bind(this, 'label', label.name)}>{label.name}</span>;
      // });
      //
      // // milestone
      // let milestoneNode = null;
      // if (issue.value.milestone) {
      //   milestoneNode = (<span className="milestone" onClick={this._handleFilterSameAs.bind(this, 'milestone', issue.value.milestone.title)}>
      //     <span className="icon icon-flag"/><span>{issue.value.milestone.title}</span>
      //   </span>);
      // }
      //
      // // comment
      // const commentsNode = (
      //   <span onClick={this._handleFilterSameAs.bind(this, 'is', isRead ? 'read' : 'unread')}>
      //     <span className="icon icon-chat"/><span>{issue.value.comments}</span>
      //   </span>);
      //
      // // assignees
      // const assigneeNodes = issue.value.assignees.map((assignee)=>{
      //   return <img key={assignee.login} title={assignee.login} src={assignee.avatar_url}
      //               onClick={this._handleFilterSameAs.bind(this, 'assignee', assignee.login)}/>
      // });
      //
  //     return (
  //       <li key={issue.id}
  //                className={`issue-list-item list-group-item ${read} ${active} ${fadeIn}`}
  //                onClick={this._handleClick.bind(this, issue)}
  //                onContextMenu={this._handleContextMenu.bind(this, issue)}>
  //
  //         <div className="body">
  //           <img className="state" src={typeIcon(issue)} onClick={this._handleFilterSameAs.bind(this, 'is', issue.type)}/>
  //           <span>{issue.title}</span>
  //         </div>
  //
  //         <div className="milestone-and-labels">
  //           {milestoneNode}
  //           {labelNodes}
  //         </div>
  //
  //         <div className="footer">
  //           <div className="user" onError={this._handleAvatar.bind(this, 'error')} onLoad={this._handleAvatar.bind(this, 'success')}>
  //             <img title={authorName} src={author} onClick={this._handleFilterSameAs.bind(this, 'author', authorName)}/>
  //             {issue.value.assignees.length ? ' → ' : ''}
  //             {assigneeNodes}
  //           </div>
  //
  //           <div className="repo" title={repo}>
  //             <span onClick={this._handleFilterSameAs.bind(this, 'user', user)}>{user}</span>
  //             /
  //             <span onClick={this._handleFilterSameAs.bind(this, 'repo', repo)}>{repo.split('/')[1]}</span>
  //           </div>
  //
  //           <div className="number" onClick={this._handleFilterSameAs.bind(this, 'number', issue.number)}>#{issue.number}</div>
  //
  //           <div className="comment-count" title={`${fromNow} (${updatedAt})`}>{commentsNode}</div>
  //           <div>
  //             <span className={`icon ${issue.marked_at ? 'icon-star' : 'icon-star-empty'}`}
  //                   onClick={this._markIssue.bind(this, issue)}/>
  //           </div>
  //         </div>
  //
  //     </li>
  //     );
  //   });
  //
  //   let waitForLoadingCount = this.state.waitForLoadingIssueIds.length;
  //   let waitForLoadingCountNode;
  //   if (waitForLoadingCount === 0) {
  //     waitForLoadingCountNode = null;
  //   } else {
  //     waitForLoadingCountNode = <li className="wait-for-loading-count" onClick={this._handleWaitForLoadingCount.bind(this)}>
  //       {waitForLoadingCount} issues were updated
  //     </li>
  //   }
  //
  //   // filter histories
  //   // const filterHistoryNodes = this.state.filterHistories.map((filter)=>{
  //   //   return <li key={filter}>{filter}</li>;
  //   // });
  //
  //   const pager = this._totalCount === 0 ? 'none' : 'block';
  //   const leftPager = this._pageNumber === 0 ? 'deactive' : 'active';
  //   const rightPager = this._hasNextPage === true ? 'active' : 'deactive';
  //
  //   return <div className="issues">
  //     <FilterFragment filter={''} onExecFilter={(filter) => console.log(filter)}/>
  //
  //     {/*<div className="progress-bar" id="issuesProgress" style={{display: 'none'}}><span/></div>*/}
  //     <ul className="list-group" id="issuesList">
  //       {/*<li className="list-group-header">*/}
  //       {/*  <input id="filterInput" className="form-control filter-input" type="text" placeholder="is:open octocat" />*/}
  //       {/*  <span className="icon icon-cancel-circled filter-clear-icon" onClick={this._handleFilterClear.bind(this)}/>*/}
  //       {/*</li>*/}
  //
  //       {/*<li className="filter-selection">*/}
  //       {/*  <select onChange={this._handleFilterSelection.bind(this)} value={this._filterSelection}>*/}
  //       {/*    <option value="updated">Sort by updated at</option>*/}
  //       {/*    <option value="read">Sort by read at</option>*/}
  //       {/*    <option value="created">Sort by created at</option>*/}
  //       {/*    <option value="closed">Sort by closed at</option>*/}
  //       {/*    <option value="dueon">Sort by due on</option>*/}
  //       {/*  </select>*/}
  //       {/*</li>*/}
  //
  //       {waitForLoadingCountNode}
  //       {issueNodes}
  //
  //       <li className="list-group pager" style={{display: pager}}>
  //         <button className={`btn btn-default ${leftPager}`} onClick={this._handlePager.bind(this, -1, false)}>
  //           <span className="icon icon-left-open"/>
  //         </button>
  //         <button className={`btn btn-default ${rightPager}`} onClick={this._handlePager.bind(this, 1, false)}>
  //           <span className="icon icon-right-open"/>
  //         </button>
  //       </li>
  //     </ul>
  //
  //     {/*<ul className="filter-histories" id="filterHistories">{filterHistoryNodes}</ul>*/}
  //   </div>;
  // }

}
