import React from 'react';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import styled from 'styled-components';
import {ClickView} from '../../Library/View/ClickView';
import {Text} from '../../Library/View/Text';
import {StreamEvent} from '../../Event/StreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {fontWeight, space} from '../../Library/Style/layout';
import {color} from '../../Library/Style/color';
import {IssueEvent} from '../../Event/IssueEvent';
import {View} from '../../Library/View/View';
import {Icon} from '../../Library/View/Icon';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

type Props = {
  stream: StreamEntity;
  filter: string;
  updatedIssueIds: number[];
  onChange: (updatedIssueIds: number[]) => void;
  onClick: () => void;
}

type State = {
}

export class IssueUpdatedBannerFragment extends React.Component<Props, State> {
  componentDidMount() {
    StreamEvent.onUpdateStreamIssues(this, (_streamId, updateIssueIds) => {
      this.handleCheckUnreadIssues(updateIssueIds);
    });

    // issueのreadが変わったときに、今保持しているupdatedIssuesを再チェックする
    IssueEvent.onUpdateIssues(this, () => {
      this.handleCheckUnreadIssues([]);
    });
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async handleCheckUnreadIssues(updatedIssueIds: number[]) {
    if (!this.props.stream) return;

    const stream = this.props.stream;
    const filters: string[] = [
      stream.defaultFilter,
      stream.userFilter,
      this.props.filter || '',
    ];

    // 過去の分も未読件数の対象とするために、保持しているprops.updatedIssueIdsもチェック対象に含める
    const updatedAllIssueIds = [...this.props.updatedIssueIds, ...updatedIssueIds];
    if (!updatedAllIssueIds.length) return;

    // 含まれるissueを取得
    const {error: error1, issueIds} = await IssueRepo.getIncludeIds(updatedAllIssueIds, stream.queryStreamId, filters.join(' '));
    if (error1) return console.error(error1);

    const {error: error2, issues} = await IssueRepo.getIssues(issueIds);
    if (error2) return console.error(error2);

    const loginName = UserPrefRepo.getUser().login;
    const unreadIssueIds = issues.filter(issue => !IssueRepo.isRead(issue)) // 未読状態をチェックする(ブラウザ内でコメントを書いた場合など、streamから更新対象として取得するけど、実際はすでに既読状態なので)
      .filter(issue => !(issue.last_timeline_user === loginName && issue.last_timeline_at === issue.updated_at)) // 最後の更新が自分ではないissue
      .map(issue => issue.id);

    this.props.onChange(unreadIssueIds);
  }

  render() {
    if (!this.props.updatedIssueIds.length) return null;

    return (
      <StickyRoot>
        <Root onClick={() => this.props.onClick()}>
          <Icon name='lightning-bolt' color={color.white}/>
          <Label>{this.props.updatedIssueIds.length} issues were updated</Label>
        </Root>
      </StickyRoot>
    );
  }
}

const StickyRoot = styled(View)`
  position: sticky;
  top: ${space.medium}px;
  left: 0;
  z-index: 10;
  align-items: center;

  /* note: stickしつつ、高さを確保しないことで、子要素をフローティングさせる */
  height: 0;
  overflow: visible;
`;

const Root = styled(ClickView)`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: ${space.small}px ${space.medium2}px;
  border-radius: 100px;
  background: ${color.brand};
  box-shadow: 0 0 4px 2px #00000020;

  /* note: StickyRootに高さがないので明示的に指定する必要がある */
  min-height: 36px;
  
  &:hover {
    background: ${color.brandHover};
  }
`;

const Label = styled(Text)`
  font-weight: ${fontWeight.bold};
  color: ${color.white};
  padding-left: ${space.small}px;
  padding-right: ${space.small}px;
`;
