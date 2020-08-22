import React from 'react';
import {BaseStreamEntity, FilteredStreamEntity} from '../../Library/Type/StreamEntity';
import styled from 'styled-components';
import {ClickView} from '../../Library/View/ClickView';
import {Text} from '../../Library/View/Text';
import {StreamEvent} from '../../Event/StreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {appTheme} from '../../Library/Style/appTheme';
import {border, fontWeight, space} from '../../Library/Style/layout';
import {color} from '../../Library/Style/color';

type Props = {
  stream: BaseStreamEntity;
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
      this.handleUpdatedStream(updateIssueIds);
    });
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
  }

  private async handleUpdatedStream(updatedIssueIds: number[]) {
    if (!updatedIssueIds.length) return;

    // stream id
    const stream = this.props.stream;
    let streamId = stream.id;
    if (stream.type === 'libraryStream') streamId = null;
    if (stream.type === 'filteredStream') streamId = (stream as FilteredStreamEntity).stream_id;

    // filter
    const filters: string[] = [
      stream.defaultFilter,
      this.props.filter || '',
    ];
    if (stream.type === 'filteredStream') filters.push((stream as FilteredStreamEntity).filter);

    // なぜなら過去の分も未読件数の対象とするために、保持しているprops.updatedIssueIdsもチェック対象に含める
    const updatedAllIssueIds = [...this.props.updatedIssueIds, ...updatedIssueIds];

    // 含まれるissueを取得
    const {error: error1, issueIds} = await IssueRepo.getIncludeIds(updatedAllIssueIds, streamId, filters.join(' '));
    if (error1) return console.error(error1);

    const {error: error2, issues} = await IssueRepo.getIssues(issueIds);
    if (error2) return console.error(error2);

    // 未読状態をチェックする(ブラウザ内でコメントを書いた場合など、streamから更新対象として取得するけど、実際はすでに既読状態なので)
    const unreadIssueIds = issues.filter(issue => !IssueRepo.isRead(issue)).map(issue => issue.id);

    this.props.onChange(unreadIssueIds);
  }

  render() {
    if (!this.props.updatedIssueIds.length) return null;

    return (
      <Root onClick={() => this.props.onClick()}>
        <Label>{this.props.updatedIssueIds.length} issues where updated</Label>
      </Root>
    );
  }
}

const Root = styled(ClickView)`
  background: ${() => appTheme().bg};
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  align-items: center;
  min-height: fit-content;
`;

const Label = styled(Text)`
  font-weight: ${fontWeight.bold};
  color: ${color.red};
  padding: ${space.medium}px;
`;
