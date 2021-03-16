import React from 'react';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {StreamRepo} from '../../Repository/StreamRepo';
import {IssueRepo} from '../../Repository/IssueRepo';
import {StreamRow} from '../../Library/View/StreamRow';
import {ScrollView} from '../../Library/View/ScrollView';
import {IssueRow} from '../../Library/View/IssueRow';
import {Text} from '../../Library/View/Text';
import {border, fontWeight, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';
import {StreamEvent} from '../../Event/StreamEvent';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {color} from '../../Library/Style/color';
import {Icon} from '../../Library/View/Icon';
import {ClickView} from '../../Library/View/ClickView';
import {JumpNavigationHistoryRepo} from '../../Repository/JumpNavigationHistoryRepo';
import {JumpNavigationHistoryEntity} from '../../Library/Type/JumpNavigationHistoryEntity';
import {RepositoryEntity} from '../../Library/Type/RepositoryEntity';
import {RepositoryRow} from '../../Library/View/RepositoryRow';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {ShellUtil} from '../../Library/Util/ShellUtil';
import {TimerUtil} from '../../Library/Util/TimerUtil';

type Item = {
  type: 'Stream' | 'Issue' | 'History' | 'Repository';
  value: StreamEntity | IssueEntity | JumpNavigationHistoryEntity | RepositoryEntity;
}

type Props = {
  show: boolean;
  onClose: () => void;
  initialKeyword?: string;
}

type State = {
  keyword: string;
  allStreams: StreamEntity[];
  allRepositories: RepositoryEntity[];
  items: Item[];
  focusItem: Item | null;
  issueCount: number;
  repositoryCount: number;
}

export class JumpNavigationFragment extends React.Component<Props, State> {
  state: State = {
    keyword: '',
    allStreams: [],
    allRepositories: [],
    items: [],
    focusItem: null,
    issueCount: 0,
    repositoryCount: 0,
  }

  private scrollView: ScrollView;

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (!prevProps.show && this.props.show) this.init();
  }

  private async init() {
    BrowserViewIPC.blur();
    const keyword = this.props.initialKeyword || '';
    this.setState({keyword, allStreams: [], items: [], focusItem: null});
    if (keyword) {
      await this.handleKeyword(keyword);
    } else {
      await Promise.all([
        this.loadInitialItems(),
        this.loadStreams(),
        this.loadRepoNames(),
      ]);
    }
  }

  private async loadInitialItems() {
    // jump navigation histories
    {
      const {error, histories} = await JumpNavigationHistoryRepo.getHistories(5);
      if (error) return console.error(error);

      const items: State['items'] = histories.map(history => ({type: 'History', value: history}));
      const focusItem = items[0];
      this.setState({items, focusItem});
    }

    // updated issues
    {
      const {error, issues, totalCount} = await IssueRepo.getIssuesInStream(null, 'sort:updated', '');
      if (error) console.error(error);

      const items: State['items'] = issues.map(issue => ({type: 'Issue', value: issue}));
      const focusItem = this.state.focusItem || items[0];

      this.setState({items: [...this.state.items, ...items], focusItem, issueCount: totalCount});
    }
  }

  private async loadStreams() {
    const {error, streams} = await StreamRepo.getAllStreams(['LibraryStream', 'SystemStream', 'UserStream', 'FilterStream', 'ProjectStream']);
    if (error) return console.error(error);

    const enabledStreams = streams.filter(s => s.enabled);

    // 表示の順番を制御する
    const allStreams = [
      ...enabledStreams.filter(s => s.type === 'LibraryStream'),
      ...enabledStreams.filter(s => s.type === 'SystemStream'),
      ...enabledStreams.filter(s => s.type === 'UserStream' || s.type === 'FilterStream' || s.type === 'ProjectStream'),
    ];
    this.setState({allStreams});
  }

  private async loadRepoNames() {
    const {error, repositories} = await IssueRepo.getAllRepositories();
    if (error) return console.error(error);
    this.setState({allRepositories: repositories});
  }

  private async searchStreams(keyword: string): Promise<StreamEntity[]> {
    if (!keyword.trim()) return [];

    const keywords = keyword.split(' ').map(k => k.toLowerCase());
    return this.state.allStreams.filter(s => {
      return keywords.every(k => s.name.toLowerCase().includes(k))
        || keywords.every(k => s.queries?.join(' ').toLowerCase().includes(k))
        || keywords.every(k => s.userFilter?.toLowerCase().includes(k));
    });
  }

  private async searchIssues(keyword: string): Promise<{issues: IssueEntity[]; totalCount: number}> {
    if (!keyword.trim()) return {issues: [], totalCount: 0};

    const {error, issues, totalCount} = await IssueRepo.getIssuesInStream(null, keyword, '');
    if (error) {
      console.error(error);
      return {issues: [], totalCount: 0};
    }
    return {issues, totalCount};
  }

  private async searchRepoNames(keyword: string): Promise<{repositories: RepositoryEntity[]; totalCount: number}> {
    if (!keyword.trim()) return {repositories: [], totalCount: 0};

    const keywords = keyword.split(' ').map(k => k.toLowerCase());
    const res = this.state.allRepositories.filter(repository => {
      return keywords.every(k => repository.fullName.toLowerCase().includes(k))
    });

    return {repositories: res.slice(0, 5), totalCount: res.length};
  }

  private async addHistory(keyword: string) {
    if (!keyword.trim()) return;

    const {error: e1, history} = await JumpNavigationHistoryRepo.addHistory(keyword);
    if (e1) console.error(e1);

    const items = [...this.state.items];
    items.unshift({type: 'History', value: history});
    this.setState({items});
  }

  private async handleKeyword(keyword: string) {
    this.setState({keyword});

    if (!keyword.trim()) {
      await this.loadInitialItems();
      return;
    }

    // スロットリングする
    await TimerUtil.sleep(200);
    if (keyword !== this.state.keyword) return;

    const streams = await this.searchStreams(keyword);
    const {issues, totalCount: issueCount} = await this.searchIssues(keyword);
    const {repositories, totalCount: repositoryCount} = await this.searchRepoNames(keyword);

    if (this.state.keyword === keyword) {
      const items: Item[] = [
        ...repositories.map<Item>(v => ({type: 'Repository', value: v})),
        ...streams.map<Item>(v => ({type: 'Stream', value: v})),
        ...issues.map<Item>(v => ({type: 'Issue', value: v})),
      ];
      if (items.length) {
        this.setState({items, issueCount, repositoryCount, focusItem: items[0]});
      } else {
        this.setState({items, focusItem: null, issueCount, repositoryCount});
      }
    }
  }

  private handleFocusNextPrev(direction: 1 | -1) {
    if (!this.state.items.length) {
      this.setState({focusItem: null});
      return;
    }

    if (!this.state.focusItem) {
      if (direction === 1) {
        this.setState({focusItem: this.state.items[0]});
      } else {
        this.setState({focusItem: this.state.items[this.state.items.length - 1]});
      }
    } else {
      const currentIndex = this.state.items.findIndex(item => item.type === this.state.focusItem.type && item.value.id === this.state.focusItem.value.id);
      if (currentIndex === -1) {
        this.setState({focusItem: this.state.items[0]});
      } else {
        // const targetIndex = (currentIndex + direction) % this.state.items.length;
        // const focusItem = this.state.items[targetIndex >= 0 ? targetIndex : this.state.items.length - 1];
        const targetIndex = currentIndex + direction;
        const focusItem = this.state.items[targetIndex];
        if (focusItem) this.setState({focusItem});

        // 上下端の場合、最後までスクロールする
        if (targetIndex === 0) {
          this.scrollView?.scrollTop();
        } else if (targetIndex === this.state.items.length - 1) {
          this.scrollView?.scrollBottom();
        }
      }
    }
  }

  private handleSelectHistory(history: JumpNavigationHistoryEntity) {
    this.handleKeyword(history.keyword);
    this.addHistory(history.keyword);
  }

  private async handleDeleteHistory(history: JumpNavigationHistoryEntity) {
    const items = this.state.items.filter(item => !(item.type === 'History' && item.value.id === history.id));
    this.setState({items});

    const {error} = await JumpNavigationHistoryRepo.deleteHistory(history.id);
    if (error) console.error(error);
  }

  private handleSelectRepository(repository: RepositoryEntity) {
    this.props.onClose();

    const github = UserPrefRepo.getPref().github;
    const url = `http${github.https ? 's' : ''}://${github.webHost}/${repository.fullName}`;
    ShellUtil.openExternal(url);

    this.addHistory(this.state.keyword);
  }

  private handleSelectStream(stream: StreamEntity) {
    this.props.onClose();
    StreamEvent.emitSelectStream(stream);

    this.addHistory(this.state.keyword);
  }

  private async handleSelectIssue(issue: IssueEntity) {
    this.props.onClose();

    const {error, stream} = await StreamRepo.getStreamMatchIssue([issue], true, false, true);
    if (error) return console.error(error);

    StreamEvent.emitSelectStream(stream, issue);

    await this.addHistory(this.state.keyword);
  }

  private handleSelectFocusItem() {
    let item: Item;
    if (this.state.focusItem) {
      item = this.state.focusItem
    } else if (this.state.items.length === 1) { // フォーカスは無いが、アイテムが1この場合はそれを選択したとみなす
      item = this.state.items[0];
    }

    if (!item) return;

    if (item.type === 'Stream') {
      this.handleSelectStream(item.value as StreamEntity);
    } else if(item.type === 'Issue') {
      this.handleSelectIssue(item.value as IssueEntity);
    } else if (item.type === 'History') {
      this.handleSelectHistory(item.value as JumpNavigationHistoryEntity);
    } else if (item.type === 'Repository') {
      this.handleSelectRepository(item.value as RepositoryEntity);
    }
  }

  render() {
    const histories = this.state.items.filter(item => item.type === 'History').map(item => item.value as JumpNavigationHistoryEntity);
    const streams = this.state.items.filter(item => item.type === 'Stream').map(item => item.value as StreamEntity);
    const issues = this.state.items.filter(item => item.type === 'Issue').map(item => item.value as IssueEntity);
    const repoNames = this.state.items.filter(item => item.type === 'Repository').map(item => item.value as RepositoryEntity);

    return (
      <Modal
        show={this.props.show}
        onClose={this.props.onClose}
        style={{alignSelf: 'flex-start', padding: 0}}
      >
        <Root>
          <Desc>Jump to streams and issues.</Desc>
          {this.renderTextInput()}
          <Divider/>

          <ScrollView
            style={{paddingTop: space.medium}}
            ref={ref => this.scrollView = ref}
          >
            {this.renderHistories(histories)}
            {this.renderDivider(streams, issues)}
            {this.renderRepoNames(repoNames)}
            {this.renderDivider(streams, issues)}
            {this.renderStreams(streams)}
            {this.renderDivider(streams, issues)}
            {this.renderIssues(issues)}
          </ScrollView>
        </Root>
      </Modal>
    );
  }

  renderTextInput() {
    return (
      <TextInput
        placeholder='octocat is:open'
        onChange={keyword => this.handleKeyword(keyword)}
        value={this.state.keyword}
        autoFocus={true}
        onArrowDown={() => this.handleFocusNextPrev(1)}
        onArrowUp={() => this.handleFocusNextPrev(-1)}
        onEnter={() => this.handleSelectFocusItem()}
        style={{marginTop: space.medium, border: 'none', paddingLeft: space.medium2}}
      />
    );
  }

  renderHistories(histories: JumpNavigationHistoryEntity[]) {
    if (this.state.keyword?.trim()) return;
    if (!histories.length) return;

    const historyViews = histories.map(history => {
      const selected = this.state.focusItem?.type === 'History' && history.id === this.state.focusItem?.value.id;
      const selectedClassName = selected ? 'history-selected' : '';
      const iconColor = selected ? color.white : appTheme().icon.normal;
      return (
        <HistoryRow key={history.id} className={selectedClassName} onClick={() => this.handleSelectHistory(history)}>
          <Icon name='history' color={iconColor}/>
          <HistoryText>{history.keyword}</HistoryText>
          <ClickView onClick={() => this.handleDeleteHistory(history)}>
            <Icon name='close-circle-outline' color={iconColor}/>
          </ClickView>
        </HistoryRow>
      );
    });

    return (
      <HistoryRoot>
        <Label>HISTORIES</Label>
        {historyViews}
      </HistoryRoot>
    );
  }

  renderStreams(streams: StreamEntity[]) {
    if (!streams.length) return;

    const streamRows = streams.map(s => {
      const selected = this.state.focusItem?.type === 'Stream' && s.id === this.state.focusItem?.value.id;
      return (
        <StreamRow
          key={s.id}
          stream={s}
          selected={selected}
          onSelect={stream => this.handleSelectStream(stream)}
          skipHandlerSameCheck={true}
          disableMenu={true}
        />
      );
    });
    return (
      <StreamsRoot>
        <Label>STREAMS ({streams.length})</Label>
        {streamRows}
      </StreamsRoot>
    );
  }

  renderRepoNames(repositories: RepositoryEntity[]) {
    if (!repositories.length) return;

    const repositoryRows = repositories.slice(0, 6).map(repository => {
      const selected = this.state.focusItem?.type === 'Repository' && repository.id === this.state.focusItem?.value.id;
      return <RepositoryRow key={repository.id} repository={repository} selected={selected}/>;
    });

    let andMore;
    if (repositories.length < this.state.repositoryCount) {
      andMore = <AndMore>and more...</AndMore>;
    }

    return (
      <RepositoriesRoot>
        <Label>REPOSITORIES ({this.state.repositoryCount})</Label>
        {repositoryRows}
        {andMore}
      </RepositoriesRoot>
    );
  }

  renderDivider(streams: StreamEntity[], issues: IssueEntity[]) {
    if (streams.length && issues.length) {
      return <Spacer/>;
    }
  }

  renderIssues(issues: IssueEntity[]) {
    if (!issues.length) return;

    const issueRows = issues.map(issue => {
      const selected = this.state.focusItem?.type === 'Issue' && issue.id === this.state.focusItem?.value.id;
      return (
        <IssueRow
          key={issue.id}
          issue={issue}
          selected={selected}
          skipHandlerSameCheck={true}
          disableMenu={true}
          onSelect={issue => this.handleSelectIssue(issue)}
          slim={true}
          scrollIntoViewIfNeededWithCenter={false}
        />
      );
    });

    let andMore;
    if (issues.length < this.state.issueCount) {
      andMore = <AndMore style={{paddingTop: space.medium, paddingBottom: space.medium}}>and more...</AndMore>;
    }

    return (
      <IssuesRoot>
        <Label>ISSUES ({this.state.issueCount})</Label>
        {issueRows}
        {andMore}
      </IssuesRoot>
    );
  }
}

const Root = styled(View)`
  width: 600px;
  height: fit-content;
  max-height: 80vh;
  padding: ${space.large}px 0 0;
`;

const Desc = styled(Text)`
  font-weight: ${fontWeight.bold};
  padding: 0 ${space.large}px;
`;

// history
const HistoryRoot = styled(View)`
  padding: ${space.large}px 0 ${space.medium}px;
`;

const HistoryRow = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  border-radius: 8px;
  padding: ${space.small2}px ${space.medium}px;
  margin: 0 ${space.medium}px;
  
  &:hover {
    background: ${() => appTheme().bg.primaryHover};
  }
  
  &.history-selected {
    background: ${() => appTheme().accent.normal};
    color: ${color.white};
  }
`;

const HistoryText = styled(Text)`
  padding-left: ${space.medium}px;
  flex: 1;
  .history-selected & {
    color: ${color.white};
  }
`;

const StreamsRoot = styled(View)`
  padding: ${space.large}px 0 0;
`;

const IssuesRoot = styled(View)`
  padding: ${space.large}px 0 0;
`;

// repositories
const RepositoriesRoot = styled(View)`
  padding-top: ${space.large}px;
`;

const AndMore = styled(Text)`
  padding-left: ${space.medium * 2}px;
`;

const Label = styled(Text)`
  font-weight: bold;
  padding: 0 ${space.large}px ${space.medium}px;
`;

const Divider = styled(View)`
  width: 100%;
  height: ${border.medium}px;
  background: ${() => appTheme().border.normal};
`;

const Spacer = styled(View)`
  width: 100%;
  height: ${space.medium2}px;
`;
