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
import {border, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';

type Item = {
  type: 'Stream' | 'Issue';
  value: StreamEntity | IssueEntity;
}

type Props = {
  show: boolean;
  onClose: () => void;
}

type State = {
  keyword: string;
  allStreams: StreamEntity[];
  items: Item[];
  focusItem: Item | null;
}

export class GlobalSearchFragment extends React.Component<Props, State> {
  state: State = {
    keyword: '',
    allStreams: [],
    items: [],
    focusItem: null,
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (!prevProps.show && this.props.show) this.init();
  }

  private init() {
    this.setState({keyword: '', allStreams: [], items: [], focusItem: null});
    this.loadStreams();
  }

  private async loadStreams() {
    const {error, streams} = await StreamRepo.getAllStreams(['LibraryStream', 'SystemStream', 'UserStream', 'FilterStream']);
    if (error) return console.error(error);
    streams.forEach(s => s.name = s.name.toLowerCase());

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
      return keywords.every(k => s.name.includes(k));
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
      this.setState({focusItem: this.state.items[0]});
    } else {
      const currentIndex = this.state.items.findIndex(item => item.type === this.state.focusItem.type && item.value.id === this.state.focusItem.value.id);
      if (currentIndex === -1) {
        this.setState({focusItem: this.state.items[0]});
      } else {
        const targetIndex = currentIndex + direction;
        const focusItem = this.state.items[targetIndex];
        if (focusItem) this.setState({focusItem});
      }
    }
  }

  render() {
    const streams = this.state.items.filter(item => item.type === 'Stream').map(item => item.value as StreamEntity);
    const issues = this.state.items.filter(item => item.type === 'Issue').map(item => item.value as IssueEntity);

    return (
      <Modal
        show={this.props.show}
        onClose={this.props.onClose}
        style={{alignSelf: 'flex-start'}}
      >
        <Root>
          <TextInput
            onChange={keyword => this.handleKeyword(keyword)}
            value={this.state.keyword}
            autoFocus={true}
            onArrowDown={() => this.handleFocusNextPrev(1)}
            onArrowUp={() => this.handleFocusNextPrev(-1)}
          />

          <ScrollView style={{paddingTop: space.medium}}>
            {this.renderStreams(streams)}
            {this.renderDivider(streams, issues)}
            {this.renderIssues(issues)}
          </ScrollView>
        </Root>
      </Modal>
    );
  }

  renderStreams(streams: StreamEntity[]) {
    if (!streams.length) return;

    const streamRows = streams.map(s => {
      const selected = this.state.focusItem?.type === 'Stream' && s.id === this.state.focusItem?.value.id;
      return (
        <StreamRow key={s.id} stream={s} selected={selected} onSelect={null} onReadAll={null}/>
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
      return <Divider/>;
    }
  }

  // todo: handlerをオプショナルにする
  renderIssues(issues: IssueEntity[]) {
    if (!issues.length) return;

    const issueRows = issues.map(issue => {
      const selected = this.state.focusItem?.type === 'Issue' && issue.id === this.state.focusItem?.value.id;
      return (
        <IssueRow
          key={issue.id}
          issue={issue}
          selected={selected}
          fadeIn={false}
          skipHandlerSameCheck={true}
          onSelect={issue => console.log(issue)}
          onReadAll={null}
          onReadCurrentAll={null}
          onUnsubscribe={null}
          onToggleMark={null}
          onToggleArchive={null}
          onToggleRead={null}
          onToggleIssueType={null}
          onToggleMilestone={null}
          onToggleLabel={null}
          onToggleAuthor={null}
          onToggleAssignee={null}
          onToggleRepoOrg={null}
          onToggleRepoName={null}
          onToggleIssueNumber={null}
          onCreateFilterStream={null}
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
`;

const StreamsRoot = styled(View)`
  padding: ${space.medium}px 0;
`;

const IssuesRoot = styled(View)`
  padding: ${space.medium}px 0;
`;

const Label = styled(Text)`
  font-weight: bold;
  padding-bottom: ${space.small}px;
`;

const Divider = styled(View)`
  width: 100%;
  height: ${border.medium}px;
  background: ${() => appTheme().borderColor};
`;
