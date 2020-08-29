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

type Props = {
  show: boolean;
  onClose: () => void;
}

type State = {
  keyword: string;
  allStreams: StreamEntity[];
  streams: StreamEntity[];
  issues: IssueEntity[];
  focusStream: StreamEntity | null;
  focusIssue: IssueEntity | null;
}

export class GlobalSearchFragment extends React.Component<Props, State> {
  state: State = {
    keyword: '',
    allStreams: [],
    streams: [],
    issues: [],
    focusStream: null,
    focusIssue: null,
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (!prevProps.show && this.props.show) this.init();
  }

  private init() {
    this.setState({keyword: '', allStreams: [], streams: [], issues: [], focusStream: null, focusIssue: null});
    this.loadStreams();
  }

  // todo: 並び順を考える
  private async loadStreams() {
    const {error, streams} = await StreamRepo.getAllStreams(['LibraryStream', 'SystemStream', 'UserStream', 'FilterStream']);
    if (error) return console.error(error);
    streams.forEach(s => s.name = s.name.toLowerCase());
    this.setState({allStreams: streams});
  }

  private async searchStreams(keyword: string) {
    if (!keyword.trim()) {
      this.setState({streams: [], focusStream: null});
      return;
    }

    const keywords = keyword.split(' ').map(k => k.toLowerCase());
    const streams = this.state.allStreams.filter(s => {
      return keywords.every(k => s.name.includes(k));
    });
    this.setState({streams});
  }

  private async searchIssues(keyword: string) {
    if (!keyword.trim()) {
      this.setState({issues: [], focusIssue: null});
      return;
    }

    const {error, issues} = await IssueRepo.getIssuesInStream(null, keyword, '');
    if (error) return console.error(error);
    if (this.state.keyword === keyword) this.setState({issues});
  }

  private focusStreamAndIssue(direction: 1 | -1): {focusStream: StreamEntity; focusIssue: IssueEntity} {
    // 検索結果がない場合
    if (!this.state.streams.length && !this.state.issues.length) {
      return {focusStream: null, focusIssue: null};
    }

    // まだ何もフォーカスされていないとき
    if (!this.state.focusStream && !this.state.focusIssue) {
      if (this.state.streams.length) {
        return {focusStream: this.state.streams[0], focusIssue: null};
      } else if (this.state.issues.length) {
        return {focusStream: null, focusIssue: this.state.issues[0]};
      }
    }

    // streamがフォーカスされている場合
    if (this.state.focusStream) {
      const currentIndex = this.state.streams.findIndex(s => s.id === this.state.focusStream.id);

      if (currentIndex === -1) { // フォーカスされているstreamが現在の検索結果にない場合
        if (this.state.streams.length) {
          return {focusStream: this.state.streams[0], focusIssue: null};
        } else if (this.state.issues.length) {
          return {focusStream: null, focusIssue: this.state.issues[0]};
        }
      } else {
        const targetIndex = currentIndex + direction;
        if (targetIndex > this.state.streams.length - 1) { // 下方範囲外の場合
          if (this.state.issues.length) { // issueがあればそれにフォーカス
           return {focusStream: null, focusIssue: this.state.issues[0]};
          } else { // なければ現在のまま
            return {focusStream: this.state.focusStream, focusIssue: null};
          }
        } else if (targetIndex < 0) { // 上方範囲外の場合は現在のまま
          return {focusStream: this.state.focusStream, focusIssue: null};
        } else { // 範囲内の場合
          return {focusStream: this.state.streams[targetIndex], focusIssue: null};
        }
      }
    }

    // issueがフォーカスされている場合
    if (this.state.focusIssue) {
      const currentIndex = this.state.issues.findIndex(issue => issue.id === this.state.focusIssue.id);

      if (currentIndex === -1) { // フォーカスされているissueが現在の検索結果にない場合
        if (this.state.streams.length) {
          return {focusStream: this.state.streams[0], focusIssue: null};
        } else if (this.state.issues.length) {
          return {focusStream: null, focusIssue: this.state.issues[0]};
        }
      } else {
        const targetIndex = currentIndex + direction;
        if (targetIndex > this.state.issues.length - 1) { // 下方範囲外
          return {focusStream: null, focusIssue: this.state.focusIssue};
        } else if (targetIndex < 0) { //上方範囲外
          if (this.state.streams.length) {
            return {focusStream: this.state.streams[this.state.streams.length - 1], focusIssue: null};
          } else {
            return {focusStream: null, focusIssue: this.state.focusIssue};
          }
        } else {
          return {focusStream: null, focusIssue: this.state.issues[targetIndex]};
        }
      }
    }
  }

  private async handleKeyword(keyword: string) {
    this.setState({keyword});
    this.searchStreams(keyword);
    this.searchIssues(keyword);
  }

  private handleFocusNextPrev(direction: 1 | -1) {
    // if (!this.state.streams.length && !this.state.issues.length) {
    //   this.setState({focusStream: null, focusIssue: null});
    //   return;
    // }
    //
    // // まだ何もフォーカスされていないとき
    // if (!this.state.focusStream && !this.state.focusIssue) {
    //   if (this.state.streams.length) {
    //     this.setState({focusStream: this.state.streams[0]});
    //   } else if (this.state.issues.length) {
    //     this.setState({focusIssue: this.state.issues[0]});
    //   }
    //   return;
    // }
    //
    // let focusStream: StreamEntity;
    // let focusIssue: IssueEntity;
    //
    // if (this.state.focusStream) {
    //   const currentIndex = this.state.streams.findIndex(s => s.id === this.state.focusStream.id);
    //   if (currentIndex === -1) {
    //     if (this.state.streams.length) {
    //       focusStream = this.state.streams[0];
    //     } else if (this.state.issues.length) {
    //       focusIssue = this.state.issues[0];
    //     }
    //   } else {
    //     const targetIndex = currentIndex + direction;
    //     if (targetIndex > this.state.streams.length - 1) {
    //       if (this.state.issues.length) {
    //         this.setState({focusStream: null, focusIssue: this.state.issues[0]});
    //       }
    //     } else if (targetIndex < 0) {
    //       // nothing
    //     } else {
    //       const focusStream = this.state.streams[targetIndex];
    //       this.setState({focusStream});
    //     }
    //   }
    // } else if (this.state.focusIssue) {
    //   const currentIndex = this.state.issues.findIndex(issue => issue.id === this.state.focusIssue.id);
    //   if (currentIndex === -1) {
    //     if (this.state.streams.length) {
    //       this.setState({focusStream: this.state.streams[0]});
    //     } else if (this.state.issues.length) {
    //       focusIssue = this.state.issues[0];
    //       this.setState({focusIssue});
    //     }
    //   } else {
    //     const targetIndex = currentIndex + direction;
    //     if (targetIndex > this.state.issues.length - 1) {
    //       // nothing
    //     } else if (targetIndex < 0) {
    //       if (this.state.streams.length) {
    //         this.setState({focusIssue: null, focusStream: this.state.streams[this.state.streams.length - 1]});
    //       }
    //     } else {
    //       focusIssue = this.state.issues[targetIndex];
    //       this.setState({focusIssue});
    //     }
    //   }
    // }

    const {focusStream, focusIssue} = this.focusStreamAndIssue(direction);
    this.setState({focusStream, focusIssue});

    // if (focusStream) {
    //   const el = ReactDOM.findDOMNode(this.issueRowRefs[focusIssue.id]) as HTMLDivElement;
    //   // @ts-ignore
    //   el.scrollIntoViewIfNeeded(false);
    // }
    //
    // if (focusIssue) {
    //   const el = ReactDOM.findDOMNode(this.issueRowRefs[focusIssue.id]) as HTMLDivElement;
    //   // @ts-ignore
    //   el.scrollIntoViewIfNeeded(false);
    // }
  }

  render() {
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
            {this.renderStreams()}
            {this.renderDivider()}
            {this.renderIssues()}
          </ScrollView>
        </Root>
      </Modal>
    );
  }

  renderStreams() {
    if (!this.state.streams.length) return;

    const streamRows = this.state.streams.map(s => {
      const selected = s.id === this.state.focusStream?.id;
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

  renderDivider() {
    if (this.state.streams.length && this.state.issues.length) {
      return <Divider/>;
    }
  }

  // todo: handlerをオプショナルにする
  renderIssues() {
    if (!this.state.issues.length) return;

    const issueRows = this.state.issues.map(issue => {
      const selected = issue.id === this.state.focusIssue?.id;
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
