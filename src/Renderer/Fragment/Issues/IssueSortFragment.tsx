import React from 'react';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {border, font, space} from '../../Style/layout';
import {appTheme} from '../../Style/appTheme';
import {Icon} from '../../Component/Core/Icon';
import {Select} from '../../Component/Core/Select';

export type SortQueryEntity = 'sort:updated' | 'sort:read' | 'sort:created' | 'sort:closed' | 'sort:dueon';

type Props = {
  sortQuery: SortQueryEntity;
  onExec: (sortQuery: SortQueryEntity) => void;
}

type State = {
}

const sortItems: {label: string, value: SortQueryEntity}[] = [
  {label: 'Sort by updated at', value: 'sort:updated'},
  {label: 'Sort by read at', value: 'sort:read'},
  {label: 'Sort by created at', value: 'sort:created'},
  {label: 'Sort by closed at', value: 'sort:closed'},
  {label: 'Sort by due on', value: 'sort:dueon'},
];

export class IssueSortFragment extends React.Component<Props, State> {
  render() {
    return (
      <SortSelectWrap>
        <SortSelect
          items={sortItems}
          onSelect={t => this.props.onExec(t as SortQueryEntity)}
          value={this.props.sortQuery}
        />
        <SortIcon name='chevron-down'/>
      </SortSelectWrap>
    );
  }
}

const SortSelectWrap = styled(View)`
  position: relative;
  border-top: solid ${border.medium}px ${() => appTheme().borderColor};
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  min-height: fit-content;
`;

const SortIcon = styled(Icon)`
  position: absolute;
  top: 0;
  right: 5px;
`;

const SortSelect = styled(Select)`
  -webkit-appearance: none;
  border: none;
  background: transparent;
  text-align: -webkit-center;
  border-radius: 0;
  padding: ${space.small}px 0;
  font-size: ${font.small}px;
  text-align-last: center;
  outline: none;
  line-height: normal; 
  color: ${() => appTheme().textSoftColor};
`;
