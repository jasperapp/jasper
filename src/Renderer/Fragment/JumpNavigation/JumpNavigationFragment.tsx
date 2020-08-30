import React from 'react';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {StreamRepo} from '../../Repository/StreamRepo';
import {IssueRepo} from '../../Repository/IssueRepo';
import {StreamRow} from '../Stream/StreamRow';
import {ScrollView} from '../../Library/View/ScrollView';
import {IssueRow} from '../Issues/IssueRow';
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

type Item = {
  type: 'Stream' | 'Issue' | 'History';
  value: StreamEntity | IssueEntity | JumpNavigationHistoryEntity;
}

type Props = {
  show: boolean;
  onClose: () => void;
}

type State = {
  keyword: string;
  histories: JumpNavigationHistoryEntity[];
  allStreams: StreamEntity[];
  items: Item[];
  focusItem: Item | null;
}

export class JumpNavigationFragment extends React.Component<Props, State> {
  state: State = {
    keyword: '',
    histories: [],
    allStreams: [],
    items: [],
    focusItem: null,
  }

  private scrollView: ScrollView;

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (!prevProps.show && this.props.show) this.init();
  }

  private init() {
    BrowserViewIPC.blur();
    this.setState({keyword: '', histories: [], allStreams: [], items: [], focusItem: null});
    this.loadHistories();
    this.loadStreams();
  }

  private async loadHistories() {
    const {error, histories} = await JumpNavigationHistoryRepo.getHistories(6);
    if (error) return console.error(error);

    const items: State['items'] = histories.map(history => ({type: 'History', value: history}));
    this.setState({histories, items});
  }

  private async addHistory(keyword: string) {
    const {error: e1} = await JumpNavigationHistoryRepo.addHistory(keyword);
    if (e1) console.error(e1);

    const {error: e2, histories} = await JumpNavigationHistoryRepo.getHistories(6);
    if (e2) return console.error(e2);
    this.setState({histories});
  }

  private async loadStreams() {
    const {error, streams} = await StreamRepo.getAllStreams(['LibraryStream', 'SystemStream', 'UserStream', 'FilterStream']);
    if (error) return console.error(error);

    // 表示の順番を制御する
    const allStreams = [
      ...streams.filter(s => s.type === 'LibraryStream'),
      ...streams.filter(s => s.type === 'SystemStream'),
      ...streams.filter(s => s.type === 'UserStream' || s.type === 'FilterStream'),
    ];
    this.setState({allStreams});
  }

  private async searchStreams(keyword: string): Promise<StreamEntity[]> {
    if (!keyword.trim()) return [];

    const keywords = keyword.split(' ').map(k => k.toLowerCase());
    return this.state.allStreams.filter(s => {
      return keywords.every(k => s.name.toLowerCase().includes(k));
    });
  }

  private async searchIssues(keyword: string): Promise<IssueEntity[]> {
    if (!keyword.trim()) return [];

    const {error, issues} = await IssueRepo.getIssuesInStream(null, keyword, '');
    if (error) {
      console.error(error);
      return [];
    }
    return issues;
  }

  private async handleKeyword(keyword: string) {
    this.setState({keyword});

    if (!keyword.trim()) {
      const items = this.state.histories.map<Item>(value => ({type: 'History', value}));
      this.setState({items, focusItem: null});
      return;
    }

    const streams = await this.searchStreams(keyword);
    const issues = await this.searchIssues(keyword);

    if (this.state.keyword === keyword) {
      const items: Item[] = [
        ...streams.map<Item>(v => ({type: 'Stream', value: v})),
        ...issues.map<Item>(v => ({type: 'Issue', value: v})),
      ];
      if (items.length) {
        this.setState({items});
      } else {
        this.setState({items, focusItem: null});
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
        const targetIndex = (currentIndex + direction) % this.state.items.length;
        const focusItem = this.state.items[targetIndex >= 0 ? targetIndex : this.state.items.length - 1];
        if (focusItem) this.setState({focusItem});
        if (targetIndex === 0) this.scrollView?.scrollTop();
      }
    }
  }

  private handleSelectHistory(history: JumpNavigationHistoryEntity) {
    this.handleKeyword(history.keyword);
    this.addHistory(history.keyword);
  }

  private async handleDeleteHistory(history: JumpNavigationHistoryEntity) {
    const histories = this.state.histories.filter(h => h.id !== history.id);
    const items: State['items'] = histories.map(history => ({type: 'History', value: history}));
    this.setState({histories, items});

    const {error} = await JumpNavigationHistoryRepo.deleteHistory(history.id);
    if (error) console.error(error);
  }

  private handleSelectStream(stream: StreamEntity) {
    this.props.onClose();
    StreamEvent.emitSelectStream(stream);

    this.addHistory(this.state.keyword);
  }

  private async handleSelectIssue(issue: IssueEntity) {
    this.props.onClose();

    const {error, stream} = await StreamRepo.getStreamMatchIssue([issue], true, false);
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
    }
  }

  render() {
    const histories = this.state.items.filter(item => item.type === 'History').map(item => item.value as JumpNavigationHistoryEntity);
    const streams = this.state.items.filter(item => item.type === 'Stream').map(item => item.value as StreamEntity);
    const issues = this.state.items.filter(item => item.type === 'Issue').map(item => item.value as IssueEntity);

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
    if (!this.state.histories.length) return;

    const historyViews = histories.map(history => {
      const selected = this.state.focusItem?.type === 'History' && history.id === this.state.focusItem?.value.id;
      const selectedClassName = selected ? 'history-selected' : '';
      const iconColor = selected ? color.white : appTheme().iconColor;
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
        <Label>Histories</Label>
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
        <Label>STREAMS</Label>
        {streamRows}
      </StreamsRoot>
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
        />
      );
    });

    return (
      <IssuesRoot>
        <Label>ISSUES</Label>
        {issueRows}
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
    background: ${() => appTheme().bgHover};
  }
  
  &.history-selected {
    background: ${color.blue};
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

const Label = styled(Text)`
  font-weight: bold;
  padding: 0 ${space.large}px ${space.medium}px;
`;

const Divider = styled(View)`
  width: 100%;
  height: ${border.medium}px;
  background: ${() => appTheme().borderColor};
`;

const Spacer = styled(View)`
  width: 100%;
  height: ${space.medium2}px;
`;
