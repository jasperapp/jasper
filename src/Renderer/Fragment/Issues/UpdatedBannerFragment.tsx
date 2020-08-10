import React from 'react';
import {BaseStreamEntity, FilteredStreamEntity} from '../../Type/StreamEntity';
import styled from 'styled-components';
import {ClickView} from '../../Component/Core/ClickView';
import {Text} from '../../Component/Core/Text';
import {StreamEvent} from '../../Event/StreamEvent';
import {SystemStreamEvent} from '../../Event/SystemStreamEvent';
import {LibraryStreamEvent} from '../../Event/LibraryStreamEvent';
import {IssueRepo} from '../../Repository/IssueRepo';
import {appTheme} from '../../Style/appTheme';
import {border, fontWeight, space} from '../../Style/layout';
import {color} from '../../Style/color';

type Props = {
  stream: BaseStreamEntity;
  filter: string;
  updatedIssueIds: number[];
  onChange: (updatedIssueIds: number[]) => void;
  onClick: () => void;
}

type State = {
}

export class UpdatedBannerFragment extends React.Component<Props, State> {
  componentDidMount() {
    SystemStreamEvent.onUpdateStream(this, (_streamId, updateIssueIds)=>{
      this.handleUpdatedStream(updateIssueIds);
    });

    StreamEvent.onUpdateStream(this, (_streamId, updateIssueIds)=>{
      this.handleUpdatedStream(updateIssueIds);
    });

    LibraryStreamEvent.onUpdateStream(this, (_streamName, updateIssueIds) => {
      this.handleUpdatedStream(updateIssueIds);
    });
  }

  componentWillUnmount() {
    StreamEvent.offAll(this);
    SystemStreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
  }

  private async handleUpdatedStream(updatedIssueIds: number[]) {
    if (!updatedIssueIds.length) return;

    const stream = this.props.stream;
    let streamId = stream.id;
    if (stream.type === 'libraryStream') streamId = null;
    if (stream.type === 'filteredStream') streamId = (stream as FilteredStreamEntity).stream_id;

    const filters: string[] = [
      stream.defaultFilter,
      this.props.filter || '',
    ];
    if (stream.type === 'filteredStream') filters.push((stream as FilteredStreamEntity).filter);

    const updatedAllIssueIds = [...this.props.updatedIssueIds, ...updatedIssueIds];
    const {error, issueIds} = await IssueRepo.getIncludeIds(updatedAllIssueIds, streamId, filters.join(' '));
    if (error) return console.error(error);

    this.props.onChange(issueIds);
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
`;

const Label = styled(Text)`
  font-weight: ${fontWeight.bold};
  color: ${color.red};
  padding: ${space.medium}px;
`;
