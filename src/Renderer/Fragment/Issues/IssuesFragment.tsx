import electron from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {StreamEvent} from '../../Event/StreamEvent';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEvent} from '../../Event/IssueEvent';
import {SystemStreamRepo} from '../../Repository/SystemStreamRepo';
import {StreamRepo} from '../../Repository/StreamRepo';
import {WebViewEvent} from '../../Event/WebViewEvent';
import {FilterHistoryRepo} from '../../Repository/FilterHistoryRepo';
import {ColorUtil} from '../../Util/ColorUtil';
import {GARepo} from '../../Repository/GARepo';
import {ConfigRepo} from '../../Repository/ConfigRepo';

const remote = electron.remote;

interface State {
  issues: any[];
  waitForLoadingIssueIds: number[];
  fadeInIssueIds: number[];
  filterHistories: string[];
}

export class IssuesFragment extends React.Component<any, State> {
  state: State = {issues: [], waitForLoadingIssueIds: [], fadeInIssueIds: [], filterHistories: []};

  private _streamId: number = null;
  private _streamName: string = null;
  private _libraryStreamName: string = null;
  private _currentIssueId: number = null;
  private _filterQuery: string = null;
  private _nowLoadingIssues = false;
  private _filterSelection = 'updated';

  private _pageNumber = 0;
  private _totalCount = 0;
  private _hasNextPage = false;

  private _handlingViKey = false;

  componentDidMount() {
    SystemStreamEvent.onSelectStream(this, (stream)=>{
      this._streamName = stream.name;
      this._streamId = stream.id;
      this._libraryStreamName = null;
      this._currentIssueId = null;
      this._pageNumber = 0;
      this._filterQuery = null;
      ReactDOM.findDOMNode(this).querySelector('#filterInput').value = '';
      this._loadIssues();
    });
    SystemStreamEvent.onUpdateStream(this, (streamId, updateIssueIds)=>{
      this._mergeWaitForLoadingIssueIds('system', streamId, updateIssueIds);
    });

    StreamEvent.onSelectStream(this, (stream, filteredStream)=>{
      const filter = filteredStream ? filteredStream.filter : null;
      this._streamName = stream.name;
      this._streamId = stream.id;
      this._libraryStreamName = null;
      this._currentIssueId = null;
      this._pageNumber = 0;
      this._filterQuery = filter;
      ReactDOM.findDOMNode(this).querySelector('#filterInput').value = filter;
      this._loadIssues();
    });
    StreamEvent.onUpdateStream(this, (streamId, updateIssueIds)=>{
      this._mergeWaitForLoadingIssueIds('stream', streamId, updateIssueIds);
    });

    LibraryStreamEvent.onSelectStream(this, streamName => {
      this._streamName = streamName;
      this._streamId = null;
      this._libraryStreamName = streamName;
      this._currentIssueId = null;
      this._pageNumber = 0;
      this._filterQuery = null;
      ReactDOM.findDOMNode(this).querySelector('#filterInput').value = '';
      this._loadIssues();
    });
    LibraryStreamEvent.onUpdateStream(this, (streamName, updateIssueIds) => {
      this._mergeWaitForLoadingIssueIds('library', streamName, updateIssueIds);
    });

    IssueEvent.onReadAllIssues(this, this._loadIssues.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this._loadIssues.bind(this));
    IssueEvent.onFocusIssue(this, this._handleClick.bind(this));
    IssueEvent.onReadIssue(this, this._updateSingleIssue.bind(this));
    IssueEvent.onMarkIssue(this, this._updateSingleIssue.bind(this));
    IssueEvent.addArchiveIssueListener(this, this._updateSingleIssue.bind(this));

    electron.ipcRenderer.on('command-issues', (_ev, commandItem)=>{
      this._handleCommand(commandItem);
    });

    // hack: React onKeyDown can not handle shift + space key.
    ReactDOM.findDOMNode(this).addEventListener('keydown', this._handleWebViewScroll.bind(this));

    // hack
    this._initHandleFilterQuery();
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  async _loadIssues() {
    if (this._nowLoadingIssues) {
      return;
    }

    this._nowLoadingIssues = true;

    // hack: DOM operation
    const list = ReactDOM.findDOMNode(this).querySelector('#issuesList');
    list.style.opacity = 0.3;

    let filterSelectionQuery;
    switch (this._filterSelection) {
      case 'created': filterSelectionQuery = 'sort:created'; break;
      case 'updated': filterSelectionQuery = ''; break;
      case 'closed': filterSelectionQuery = 'sort:closed'; break;
      case 'read': filterSelectionQuery = 'sort:read'; break;
      case 'dueon': filterSelectionQuery = 'is:open sort:dueon'; break;
      default: filterSelectionQuery = '';
    }

    let filterQuery;
    if (this._filterQuery) {
      filterQuery = this._filterQuery + ` ${filterSelectionQuery}`;
    } else {
      filterQuery = filterSelectionQuery;
    }

    if (ConfigRepo.getConfig().general.onlyUnreadIssue) {
      filterQuery += ' is:unread';
    }

    let result;
    if (this._streamId !== null) {
      result = await IssueRepo.findIssues(this._streamId, filterQuery, this._pageNumber);
    } else if (this._libraryStreamName) {
      result = await IssueRepo.findIssuesFromLibrary(this._libraryStreamName, filterQuery, this._pageNumber);
    }

    if (!result) return;

    // hack: DOM operation
    if (this._pageNumber === 0) {
      const container = ReactDOM.findDOMNode(this).parentElement;
      container.scrollTop = 0;
    }

    this._totalCount = result.totalCount;
    this._hasNextPage = result.hasNextPage;

    if (!result.issues.find((issue) => issue.id === this._currentIssueId)) {
      this._currentIssueId = null;
    }

    this.setState({
      issues: result.issues,
      waitForLoadingIssueIds: [],
      fadeInIssueIds: this.state.waitForLoadingIssueIds
    });

    // hack: DOM operation
    list.style.opacity = null;

    this._nowLoadingIssues = false;
  }

  async _mergeWaitForLoadingIssueIds(type, streamIdOrName, updatedIssueIds) {
    let ids;
    if (this._libraryStreamName && type === 'library' && this._libraryStreamName === streamIdOrName) {
      ids = updatedIssueIds;
    } else if (this._streamId !== null && type == 'system') {
      ids = await IssueRepo.includeIds(this._streamId, updatedIssueIds);
    } else if (this._streamId !== null && type == 'stream') {
      ids = await IssueRepo.includeIds(this._streamId, updatedIssueIds, this._filterQuery);
    } else {
      return;
    }

    const waitForLoadingIssueIds = this.state.waitForLoadingIssueIds;
    for (const id of ids) {
      if (!waitForLoadingIssueIds.includes(id)) waitForLoadingIssueIds.push(id);
    }

    this.setState({waitForLoadingIssueIds});
  }

  async _markIssue(issue, ev) {
    GARepo.eventIssueMark(!issue.marked_at);
    ev.stopPropagation();
    issue = await IssueRepo.mark(issue.id, issue.marked_at ? null : new Date());
    this._updateSingleIssue(issue);
  }

  async _archiveIssue(issue) {
    GARepo.eventIssueArchive(!issue.archived_at);
    const date = issue.archived_at ? null : new Date();
    issue = await IssueRepo.archive(issue.id, date);
    this._updateSingleIssue(issue);
  }

  async _unreadIssue(issue) {
    const date = IssueRepo.isRead(issue) ? null : new Date();
    issue = await IssueRepo.read(issue.id, date);
    this._updateSingleIssue(issue);
    GARepo.eventIssueRead(false);
    return issue;
  }

  async _readIssue(issue) {
    IssueEvent.emitSelectIssue(issue, issue.read_body);
    issue = await IssueRepo.read(issue.id, new Date());
    this._updateSingleIssue(issue);
    GARepo.eventIssueRead(true);
    return issue;
  }

  _updateSingleIssue(issue) {
    const issues = this.state.issues;
    const index = issues.findIndex((_issue) => _issue.id === issue.id);
    if (index === -1) return;
    issues[index] = issue;
    this.setState({issues});
  }

  async _unsubscribe(issue) {
    const url = issue.html_url;
    await SystemStreamRepo.unsubscribe(url);
    await this._loadIssues();
  }

  async _handleClick(issue, ev?) {
    if (ev && (ev.shiftKey || ev.metaKey)) {
      electron.shell.openExternal(issue.html_url);
      return;
    }

    // hack: dom operation
    // クリックしてからすぐにissueのactive状態を切り替えるためにDOM操作してしまっている
    if (ev) {
      const prevEl = ReactDOM.findDOMNode(this).querySelector('li.active');
      if(prevEl) prevEl.classList.remove('active');
      const el = ev.currentTarget;
      el.classList.add('active');
    }

    this._currentIssueId = issue.id;
    await this._readIssue(issue);
  }

  async _handleViKey(direction, skipReadIssue?) {
    if (this._handlingViKey) return;
    if (!this._currentIssueId) {
      const issue = this.state.issues[0];
      const el = ReactDOM.findDOMNode(this).querySelector('.issue-list-item');
      if (issue && el) this._handleClick(issue, {currentTarget: el});
      return;
    }

    this._handlingViKey = true;
    const issueId = this._currentIssueId;
    const issues = this.state.issues;
    const index = issues.findIndex((_issue) => _issue.id === issueId);
    let nextIndex;
    if (skipReadIssue) {
      nextIndex = issues.findIndex((_issue, _index) => {
        if (IssueRepo.isRead(_issue)) return false;

        if (direction > 0) {
          return _index > index;
        } else {
          return _index < index;
        }
      });
    } else {
      nextIndex = index + direction;
    }

    if (issues[nextIndex]) {
      const currentEl = ReactDOM.findDOMNode(this).querySelector('li.active');
      currentEl.classList.remove('active');
      const nextEl = currentEl.parentElement.querySelectorAll('.issue-list-item')[nextIndex];
      nextEl.classList.add('active');
      nextEl.scrollIntoViewIfNeeded(false);

      await this._handleClick(issues[nextIndex]);
    } else {
      const pagingResult = await this._handlePager(direction, direction === -1);
      if (!pagingResult || this.state.issues.length === 0) {
        this._handlingViKey = false;
        return;
      }
      const nextIssue = direction === 1 ? this.state.issues[0] : this.state.issues[this.state.issues.length - 1];
      await this._handleClick(nextIssue);
    }

    this._handlingViKey = false;
  }

  _handleWebViewScroll(ev) {
    if (!ev.target.classList.contains('issues')) return;
    if (!this._currentIssueId) return;

    if (ev.keyCode === 32) {
      WebViewEvent.emitScroll(ev.shiftKey ? -1 : 1);
      ev.preventDefault();
    }
  }

  _handleContextMenu(issue) {
    const MenuItem = remote.MenuItem;
    const clipboard = electron.clipboard;
    const shell = electron.shell;

    const menu = new remote.Menu();
    menu.append(new MenuItem({
      label: IssueRepo.isRead(issue) ? 'Mark as Unread' : 'Mark as Read',
      click: this._unreadIssue.bind(this, issue)
    }));

    menu.append(new MenuItem({
      label: issue.archived_at ? 'UnArchive' : 'Archive',
      click: this._archiveIssue.bind(this, issue)
    }));

    if (this._streamId === SystemStreamRepo.STREAM_ID_SUBSCRIPTION) {
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Unsubscribe',
        click: this._unsubscribe.bind(this, issue)
      }));
    }

    // mark current, mark all
    {
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Mark Current as Read',
        click: async ()=>{
          if (confirm('Would you like to mark current issues as read?')) {
            const issueIds = this.state.issues.map((issue) => issue.id);
            await IssueRepo.readIssues(issueIds);
            this._loadIssues();
            GARepo.eventIssueReadCurrent();
          }
        }
      }));

      if (this._streamId !== null) {
        menu.append(new MenuItem({
          label: 'Mark All as Read',
          click: async ()=>{
            if (confirm(`Would you like to mark "${this._streamName}" all as read?`)) {
              await IssueRepo.readAll(this._streamId);
              this._loadIssues();
              GARepo.eventIssueReadAll();
            }
          }
        }));
      }

      if (this._libraryStreamName) {
        menu.append(new MenuItem({
          label: 'Mark All as Read',
          click: async ()=>{
            if (confirm(`Would you like to mark "${this._streamName}" all as read?`)) {
              await IssueRepo.readAllFromLibrary(this._libraryStreamName);
              this._loadIssues();
            }
          }
        }));
      }
    }

    // create filter
    if (this._filterQuery && this._streamId && this._streamId >= 0) {
      menu.append(new MenuItem({ type: 'separator' }));
      menu.append(new MenuItem({
        label: 'Create Filter',
        click: async ()=>{
          const {error, stream} = await StreamRepo.getStream(this._streamId);
          if (error) return console.error(error);
          StreamEvent.emitOpenFilteredStreamSetting(stream, this._filterQuery);
        }
      }));
    }

    // open browser, copy link
    {
      menu.append(new MenuItem({ type: 'separator' }));

      menu.append(new MenuItem({
        label: 'Open Browser',
        click: ()=>{
          shell.openExternal(issue.value.html_url);
        }
      }));

      menu.append(new MenuItem({
        label: 'Copy Link',
        click: ()=>{
          clipboard.writeText(issue.value.html_url);
        }
      }));
    }

    menu.popup({window: remote.getCurrentWindow()});
  }

  async _initHandleFilterQuery() {
    const filterInput = ReactDOM.findDOMNode(this).querySelector('#filterInput');
    filterInput.addEventListener('click', this._handleFilterQuery.bind(this));
    filterInput.addEventListener('keydown', this._handleFilterQuery.bind(this));
    filterInput.addEventListener('keyup', this._handleFilterQuery.bind(this));
    document.body.addEventListener('click',()=>{
      ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
      if (!filterInput.value && this._filterQuery) {
        this._filterQuery = '';
        this._loadIssues();
      }
    });

    ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
    const {error, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
    if (error) return console.error(error);
    const filters = filterHistories.map(filterHistory => filterHistory.filter);
    this.setState({filterHistories: filters});
  }

  // hack: フィルター履歴のインタラクション、複雑すぎる。これ簡単にできるのだろうか
  async _handleFilterQuery(ev) {
    // load issues with filter query
    const loadIssues = async (filterQuery) => {
      this._filterQuery = filterQuery;
      this._pageNumber = 0;
      await FilterHistoryRepo.add(this._filterQuery);
      const {error, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
      if (error) return console.error(error);
      const filters = filterHistories.map(filterHistory => filterHistory.filter);
      this.setState({filterHistories: filters});
      ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
      this._loadIssues();
    };

    // move filter histories focus with direction
    const moveFilterHistoriesFocus = (inputEl, direction)=>{
      // 下キーを押した時に履歴が表示されていなければ、再スタートして処理を終了する
      if (direction === 1) {
        const filterHistoriesEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories');
        if (filterHistoriesEl.classList.contains('hidden')) {
          //filterHistoriesEl.classList.remove('hidden');
          start(inputEl);
          return;
        }
      }

      const activeEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories:not(.hidden) li.active');
      if (activeEl) {
        let el = activeEl;
        while(el) {
          el = direction === 1 ? el.nextElementSibling : el.previousElementSibling;
          if (el && !el.classList.contains('hidden')) break;
        }

        if (el) {
          el.classList.add('active');
          activeEl.classList.remove('active');
          inputEl.value = el.textContent;
        }
      } else {
        const el = ReactDOM.findDOMNode(this).querySelector('#filterHistories:not(.hidden) li:not(.hidden)');
        if (el) {
          el.classList.add('active');
          inputEl.value = el.textContent;
        }
      }
    };

    // deactive current active history
    const clearActive = ()=> {
      const currentEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories li.active');
      if (currentEl) currentEl.classList.remove('active');
    };

    // change filter history element visibility
    const changeHistoryVisibility = (filterQuery) =>{
      const filterHistoriesEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories');
      filterHistoriesEl.classList.remove('hidden');
      const inputtingFilter = filterQuery;
      const els = ReactDOM.findDOMNode(this).querySelectorAll('#filterHistories li');
      for (const el of (Array.from(els) as HTMLElement[])) {
        if (el.textContent.includes(inputtingFilter)) {
          el.classList.remove('hidden');
        } else {
          el.classList.add('hidden');
          el.classList.remove('active');
        }
      }
    };

    const start = async (inputEl) => {
      const filterHistoriesEl = ReactDOM.findDOMNode(this).querySelector('#filterHistories');
      filterHistoriesEl.classList.remove('hidden');

      const els = ReactDOM.findDOMNode(this).querySelectorAll('#filterHistories li');
      for (const el of Array.from(els as HTMLElement[])) el.classList.remove('hidden');

      filterHistoriesEl.onclick = (ev)=>{
        loadIssues(ev.target.textContent);
        GARepo.eventIssueFilter();
      };
      filterHistoriesEl.onmousemove = (ev) => {
        if (ev.target === filterHistoriesEl) return;

        const activeEl = filterHistoriesEl.querySelector('.active');
        if (activeEl) activeEl.classList.remove('active');
        ev.target.classList.add('active');
        inputEl.value = ev.target.textContent;
      };
    };

    if (ev.type === 'click') {
      start(ev.currentTarget);
      ev.stopPropagation(); // see this._initHandleFilterQuery() document.body
    }

    if (ev.type === 'keydown') {
      if (ev.keyCode === 13) { // enter
        loadIssues(ev.currentTarget.value);
        GARepo.eventIssueFilter();
        return;
      }

      if (ev.keyCode === 27) { // esc
        ReactDOM.findDOMNode(this).querySelector('#filterHistories').classList.add('hidden');
        return;
      }

      if (ev.keyCode === 40 || ev.keyCode === 38) { // 40 = down, 38 = up
        ev.preventDefault();
        moveFilterHistoriesFocus(ev.currentTarget, ev.keyCode === 40 ? 1 : -1);
        return;
      }

      clearActive();
    }

    if (ev.type === 'keyup') {
      if (ev.keyCode === 40 || ev.keyCode === 38 || ev.keyCode === 13 || ev.keyCode === 27) return;
      changeHistoryVisibility(ev.currentTarget.value);
    }
  }

  _handleFilterClear() {
    this._filterQuery = '';
    ReactDOM.findDOMNode(this).querySelector('#filterInput').value = '';
    this._loadIssues();
  }

  async _handleFilterSelection(ev) {
    this._filterSelection = ev.target.value;
    await this._loadIssues();
  }

  async _execFilter(query) {
    const el = ReactDOM.findDOMNode(this).querySelector('#filterInput');
    if (!query) { // clear
      el.value = '';
    } else if (el.value) { // add or remove
      let removed = false;
      if (el.value === query) {
        el.value = '';
        removed = true;
      } else {
        const patterns = [`${query} `,` ${query}`];
        for (const pattern of patterns) {
          if (el.value.includes(pattern)) {
            el.value = el.value.replace(pattern, '');
            removed = true;
            break;
          }
        }
      }

      if (!removed) el.value += ` ${query}`;
    } else { // assign
      el.value = query;
    }

    this._pageNumber = 0;
    this._filterQuery = el.value;
    return this._loadIssues();
  }

  async _handlePager(direction, toBottom = false) {
    if (direction > 0 && this._hasNextPage) {
      this._pageNumber++;
    } else if(direction < 0 && this._pageNumber > 0){
      this._pageNumber--;
    } else {
      return false;
    }

    await this._loadIssues();
    const el = ReactDOM.findDOMNode(this).parentElement;
    if (toBottom) {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTop = 0;
    }

    return true;
  }

  _handleWaitForLoadingCount() {
    this._loadIssues();
  }

  _handleAvatar(result, evt) {
    const img = evt.target;
    if (result === 'error') {
      img.style.display = 'none';
    } else if (result === 'success') {
      img.style.display = null;
    }
  }

  _handleFilterSameAs(key, value, evt) {
    evt.stopPropagation();

    if (typeof value === 'string' && value.includes(' ')) value = `"${value}"`;
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

    ReactDOM.findDOMNode(this).querySelector('#filterInput').value = query;
    this._pageNumber = 0;
    this._filterQuery = query;
    this._loadIssues();
  }

  render() {
    function typeIcon(issue) {
      if (issue.type === 'issue') {
        if (issue.closed_at === null) {
          return '../image/icon_issue_open.svg';
        } else {
          return '../image/icon_issue_close.svg';
        }
      } else {
        if (issue.closed_at === null) {
          return '../image/icon_pr_open.svg';
        } else {
          return '../image/icon_pr_close.svg';
        }
      }
    }

    const issueNodes = this.state.issues.map((issue)=>{
      const user = issue.user;
      const repo = issue.repo;
      const author = issue.value.user.avatar_url;
      const authorName = issue.value.user.login;

      const active = this._currentIssueId === issue.id ? 'active' : '';
      const isRead = IssueRepo.isRead(issue);
      const read = isRead ? 'read-true' : 'read-false';
      const updatedAt = moment(moment.utc(issue.updated_at).toDate()).format('YYYY-MM-DD HH:mm:ss');
      const fromNow = moment(moment.utc(issue.updated_at)).fromNow();

      const fadeIn = this.state.fadeInIssueIds.includes(issue.id) ? 'fade-in' : '';

      // labels
      const labelNodes = issue.value.labels.map((label)=>{
        const style = {
          backgroundColor: `#${label.color}`,
          color: `#${ColorUtil.suitTextColor(label.color)}`
        };
        return <span
          key={label.id} style={style} title={label.name}
          onClick={this._handleFilterSameAs.bind(this, 'label', label.name)}>{label.name}</span>;
      });

      // milestone
      let milestoneNode = null;
      if (issue.value.milestone) {
        milestoneNode = (<span className="milestone" onClick={this._handleFilterSameAs.bind(this, 'milestone', issue.value.milestone.title)}>
          <span className="icon icon-flag"/><span>{issue.value.milestone.title}</span>
        </span>);
      }

      // comment
      const commentsNode = (
        <span onClick={this._handleFilterSameAs.bind(this, 'is', isRead ? 'read' : 'unread')}>
          <span className="icon icon-chat"/><span>{issue.value.comments}</span>
        </span>);

      // assignees
      const assigneeNodes = issue.value.assignees.map((assignee)=>{
        return <img key={assignee.login} title={assignee.login} src={assignee.avatar_url}
                    onClick={this._handleFilterSameAs.bind(this, 'assignee', assignee.login)}/>
      });

      return (
        <li key={issue.id}
                 className={`issue-list-item list-group-item ${read} ${active} ${fadeIn}`}
                 onClick={this._handleClick.bind(this, issue)}
                 onContextMenu={this._handleContextMenu.bind(this, issue)}>

          <div className="body">
            <img className="state" src={typeIcon(issue)} onClick={this._handleFilterSameAs.bind(this, 'is', issue.type)}/>
            <span>{issue.title}</span>
          </div>

          <div className="milestone-and-labels">
            {milestoneNode}
            {labelNodes}
          </div>

          <div className="footer">
            <div className="user" onError={this._handleAvatar.bind(this, 'error')} onLoad={this._handleAvatar.bind(this, 'success')}>
              <img title={authorName} src={author} onClick={this._handleFilterSameAs.bind(this, 'author', authorName)}/>
              {issue.value.assignees.length ? ' → ' : ''}
              {assigneeNodes}
            </div>

            <div className="repo" title={repo}>
              <span onClick={this._handleFilterSameAs.bind(this, 'user', user)}>{user}</span>
              /
              <span onClick={this._handleFilterSameAs.bind(this, 'repo', repo)}>{repo.split('/')[1]}</span>
            </div>

            <div className="number" onClick={this._handleFilterSameAs.bind(this, 'number', issue.number)}>#{issue.number}</div>

            <div className="comment-count" title={`${fromNow} (${updatedAt})`}>{commentsNode}</div>
            <div>
              <span className={`icon ${issue.marked_at ? 'icon-star' : 'icon-star-empty'}`}
                    onClick={this._markIssue.bind(this, issue)}/>
            </div>
          </div>

      </li>
      );
    });

    let waitForLoadingCount = this.state.waitForLoadingIssueIds.length;
    let waitForLoadingCountNode;
    if (waitForLoadingCount === 0) {
      waitForLoadingCountNode = null;
    } else {
      waitForLoadingCountNode = <li className="wait-for-loading-count" onClick={this._handleWaitForLoadingCount.bind(this)}>
        {waitForLoadingCount} issues were updated
      </li>
    }

    // filter histories
    const filterHistoryNodes = this.state.filterHistories.map((filter)=>{
      return <li key={filter}>{filter}</li>;
    });

    const pager = this._totalCount === 0 ? 'none' : 'block';
    const leftPager = this._pageNumber === 0 ? 'deactive' : 'active';
    const rightPager = this._hasNextPage === true ? 'active' : 'deactive';

    return <div className="issues">
      <div className="progress-bar" id="issuesProgress" style={{display: 'none'}}><span/></div>
      <ul className="list-group" id="issuesList">
        <li className="list-group-header">
          <input id="filterInput" className="form-control filter-input" type="text" placeholder="is:open octocat" />
          <span className="icon icon-cancel-circled filter-clear-icon" onClick={this._handleFilterClear.bind(this)}/>
        </li>

        <li className="filter-selection">
          <select onChange={this._handleFilterSelection.bind(this)} value={this._filterSelection}>
            <option value="updated">Sort by updated at</option>
            <option value="read">Sort by read at</option>
            <option value="created">Sort by created at</option>
            <option value="closed">Sort by closed at</option>
            <option value="dueon">Sort by due on</option>
          </select>
        </li>

        {waitForLoadingCountNode}
        {issueNodes}

        <li className="list-group pager" style={{display: pager}}>
          <button className={`btn btn-default ${leftPager}`} onClick={this._handlePager.bind(this, -1, false)}>
            <span className="icon icon-left-open"/>
          </button>
          <button className={`btn btn-default ${rightPager}`} onClick={this._handlePager.bind(this, 1, false)}>
            <span className="icon icon-right-open"/>
          </button>
        </li>
      </ul>

      <ul className="filter-histories" id="filterHistories">{filterHistoryNodes}</ul>
    </div>;
  }

  _handleCommand(commandItem) {
    const command = commandItem.command;
    switch (command) {
      case 'load':
        this._loadIssues();
        break;
      case 'next':
        this._handleViKey(1);
        break;
      case 'prev':
        this._handleViKey(-1);
        break;
      case 'next_with_skip':
        this._handleViKey(1, true);
        break;
      case 'prev_with_skip':
        this._handleViKey(-1, true);
        break;
      case 'focus_filter':
        ReactDOM.findDOMNode(this).querySelector('#filterInput').focus();
        break;
      case 'filter_unread':
        this._execFilter('is:unread');
        break;
      case 'filter_open':
        this._execFilter('is:open');
        break;
      case 'filter_mark':
        this._execFilter('is:star');
        break;
      case 'filter_author':
        this._execFilter(`author:${ConfigRepo.getLoginName()}`);
        break;
      case 'filter_assignee':
        this._execFilter(`assignee:${ConfigRepo.getLoginName()}`);
        break;
      case 'filter_clear':
        this._execFilter('');
        break;
    }
  }
}
