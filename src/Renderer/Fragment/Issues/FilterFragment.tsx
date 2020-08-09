import React from 'react';
import {FilterHistoryRepo} from '../../Repository/FilterHistoryRepo';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {TextInput} from '../../Component/Core/TextInput';
import {border, font, space} from '../../Style/layout';
import {Select} from '../../Component/Core/Select';
import {appTheme} from '../../Style/appTheme';
import {Icon} from '../../Component/Core/Icon';

type Props = {
  filter: string,
  onExecFilter: (filter: string) => void;
}

type State = {
  filter: string;
  sort: string;
  filterHistories: string[];
}

export class FilterFragment extends React.Component<Props, State> {
  state: State = {
    filter: this.props.filter || '',
    sort: 'sort:updated',
    filterHistories: [],
  }

  componentDidMount() {
    this.loadFilterHistories();
  }

  private async loadFilterHistories() {
    const {error, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
    if (error) return console.error(error);

    this.setState({filterHistories: filterHistories.map(v => v.filter)});
  }

  private async handleExecFilter() {
    if (!this.state.filter?.trim()) return;

    const filter = `${this.state.filter} ${this.state.sort}`;
    this.props.onExecFilter(filter);

    const {error} = await FilterHistoryRepo.createFilterHistory(this.state.filter);
    if (error) return console.error(error);
    await this.loadFilterHistories();
  }

  private async handleClearFilter() {
    this.props.onExecFilter(this.state.sort);
  }

  private async handleExecSort() {
    const filter = `${this.state.filter ? this.state.filter : ''} ${this.state.sort}`;
    this.props.onExecFilter(filter);
  }

  render() {
    const sortItems = [
      {label: 'Sort by updated at', value: 'sort:updated'},
      {label: 'Sort by read at', value: 'sort:read'},
      {label: 'Sort by created at', value: 'sort:created'},
      {label: 'Sort by closed at', value: 'sort:closed'},
      {label: 'Sort by due on', value: 'sort:dueon'},
    ]

    return (
      <Root>
        <FilterInputWrap>
          <TextInput
            value={this.state.filter}
            onChange={t => this.setState({filter: t})}
            onEnter={() => this.handleExecFilter()}
            onClear={() => this.setState({filter: ''}, () => this.handleClearFilter())}
            onSelectCompletion={t => this.setState({filter: t}, () => this.handleExecFilter())}
            onFocusCompletion={t => this.setState({filter: t})}
            placeholder='is:open octocat'
            completions={this.state.filterHistories}
            showClearButton={true}
          />
        </FilterInputWrap>

        <SortSelectWrap>
          <SortSelect
            items={sortItems}
            onSelect={t => this.setState({sort: t}, () => this.handleExecSort())}
            value={this.state.sort}
          />
          <SortIcon name='chevron-down'/>
        </SortSelectWrap>
      </Root>
    );
  }
}

const Root = styled(View)`
  /* filter historyを表示するため */
  overflow: visible;
`;

// filter text
const FilterInputWrap = styled(View)`
  padding: ${space.medium}px;
  
  /* filter historyを表示するため */
  overflow: visible;
`;

// sort select
const SortSelectWrap = styled(View)`
  position: relative;
  border-top: solid ${border.medium}px ${() => appTheme().borderColor};
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
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
