import React from 'react';
import styled from 'styled-components';
import {IssueChannels} from '../../../IPC/Issue/Issue.channel';
import {appTheme} from '../../Library/Style/appTheme';
import {border, font, fontWeight, space} from '../../Library/Style/layout';
import {IconNameType} from '../../Library/Type/IconNameType';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {ClickView} from '../../Library/View/ClickView';
import {ContextMenu, ContextMenuType} from '../../Library/View/ContextMenu';
import {DraggableHeader} from '../../Library/View/DraggableHeader';
import {IconButton} from '../../Library/View/IconButton';
import {Text} from '../../Library/View/Text';
import {TextInput} from '../../Library/View/TextInput';
import {TrafficLightsSpace} from '../../Library/View/TrafficLightsSpace';
import {Translate} from '../../Library/View/Translate';
import {View} from '../../Library/View/View';
import {FilterHistoryRepo} from '../../Repository/FilterHistoryRepo';

export type SortQueryEntity = 'sort:updated' | 'sort:read' | 'sort:created' | 'sort:closed' | 'sort:merged' | 'sort:dueon';

type Props = {
  stream: StreamEntity | null;
  issueCount: number;
  filterQueries: string[];
  sortQuery: SortQueryEntity;
  onExecFilter: (filterQueries: string[]) => void;
  onExecToggleFilter: (filterQuery: string) => void;
  onExecSort: (sortQuery: SortQueryEntity) => void;
}

type State = {
  mode: 'normal' | 'filter';
  filterQueries: string[];
  filterHistories: string[];
  showFilterMenu: boolean;
  showSortMenu: boolean;
  autoFocusFilter: boolean;
}

export class IssuesHeaderFragment extends React.Component<Props, State> {
  state: State = {
    mode: 'normal',
    filterQueries: this.props.filterQueries,
    filterHistories: [],
    showFilterMenu: false,
    showSortMenu: false,
    autoFocusFilter: false,
  }

  private filterMenus: ContextMenuType[];
  private filterMenuPos: {top: number; left: number};

  private sortMenus: ContextMenuType[];
  private sortMenuPos: {top: number; left: number};

  private textInput: TextInput;

  componentDidMount() {
    this.loadFilterHistories();
    window.ipc.on(IssueChannels.focusFilter, () => this.textInput.focus());
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.filterQueries.join() !== prevProps.filterQueries.join()) {
      this.setState({filterQueries: this.props.filterQueries});

      // フィルターが変化したとき、初期状態のフィルターと比較してmodeを切り替える
      const initialFilter = this.props.stream.userFilters.join();
      const currentQuery = this.props.filterQueries.join();
      if (this.state.mode === 'normal' && initialFilter !== currentQuery) this.setState({mode: 'filter', autoFocusFilter: false});
      if (this.state.mode === 'filter' && initialFilter === currentQuery) this.setState({mode: 'normal'});
    }
  }

  private async loadFilterHistories() {
    const {error, filterHistories} = await FilterHistoryRepo.getFilterHistories(10);
    if (error) return console.error(error);

    this.setState({filterHistories: filterHistories.map(v => v.filter)});
  }

  private async handleExecFilter(filterQueryIndex: number) {
    const filterQueries = this.state.filterQueries;
    this.props.onExecFilter(filterQueries);

    const filterQuery = this.state.filterQueries[filterQueryIndex];
    if (filterQuery) {
      const {error} = await FilterHistoryRepo.createFilterHistory(filterQuery);
      if (error) return console.error(error);
      await this.loadFilterHistories();
    }
  }

  private async handleExecSort(sortQuery: SortQueryEntity) {
    this.props.onExecSort(sortQuery);
  }

  private handleShowFilterMenu(ev: React.MouseEvent) {
    const i = (filterQuery: string): IconNameType => {
      const regExp = new RegExp(` *${filterQuery} *`);
      const matched = this.state.filterQueries.some(filterQuery => filterQuery.match(regExp));
      return matched ? 'check-box-outline' : 'checkbox-blank-outline';
    };

    this.filterMenus = [
      {icon: i('is:unread'), label: <Translate onMessage={mc => mc.issueHeader.filter.unread}/>, subLabel: '(U)', handler: () => this.props.onExecToggleFilter('is:unread')},
      {icon: i('is:open'), label: <Translate onMessage={mc => mc.issueHeader.filter.open}/>, subLabel: '(O)', handler: () => this.props.onExecToggleFilter('is:open')},
      {icon: i('is:bookmark'), label: <Translate onMessage={mc => mc.issueHeader.filter.bookmark}/>, subLabel: '(M)', handler: () => this.props.onExecToggleFilter('is:bookmark')},
      {type: 'separator'},
    ];

    if (this.state.mode === 'normal') {
      this.filterMenus.push({icon: 'pencil-outline', label: <Translate onMessage={mc => mc.issueHeader.edit.show}/>, handler: () => this.setState({mode: 'filter', autoFocusFilter: true})});
    } else {
      this.filterMenus.push({icon: 'pencil-off-outline', label: <Translate onMessage={mc => mc.issueHeader.edit.close}/>, handler: () => this.setState({mode: 'normal'})});
    }

    this.filterMenuPos = {left: ev.clientX, top: ev.clientY};
    this.setState({showFilterMenu: true});
  }

  private handleShowSortMenu(ev: React.MouseEvent) {
    const i = (sortQuery: SortQueryEntity): IconNameType => {
      return this.props.sortQuery === sortQuery ? 'radiobox-marked': 'radiobox-blank';
    }

    this.sortMenus = [
      {icon: i('sort:updated'), label: <Translate onMessage={mc => mc.issueHeader.sort.updated}/>, handler: () => this.handleExecSort('sort:updated')},
      {icon: i('sort:read'), label: <Translate onMessage={mc => mc.issueHeader.sort.read}/>, handler: () => this.handleExecSort('sort:read')},
      {icon: i('sort:created'), label: <Translate onMessage={mc => mc.issueHeader.sort.created}/>, handler: () => this.handleExecSort('sort:created')},
      {icon: i('sort:closed'), label: <Translate onMessage={mc => mc.issueHeader.sort.closed}/>, handler: () => this.handleExecSort('sort:closed')},
      {icon: i('sort:merged'), label: <Translate onMessage={mc => mc.issueHeader.sort.merged}/>, handler: () => this.handleExecSort('sort:merged')},
      {icon: i('sort:dueon'), label: <Translate onMessage={mc => mc.issueHeader.sort.due}/>, handler: () => this.handleExecSort('sort:dueon')},
    ];

    this.sortMenuPos = {left: ev.clientX, top: ev.clientY};
    this.setState({showSortMenu: true});
  }

  private handleSetFilter(filterQuery: string, index: number, cb?: () => void) {
    const filterQueries = [...this.state.filterQueries];
    filterQueries[index] = filterQuery;
    this.setState({filterQueries: filterQueries.filter(f => f?.length > 0)}, () => cb?.());
  }

  render() {
    return (
      <Root>
        <TrafficLightsSpace/>
        {this.renderNormalMode()}
        {this.renderFilterMode()}

        <ContextMenu
          show={this.state.showFilterMenu}
          onClose={() => this.setState({showFilterMenu: false})}
          pos={this.filterMenuPos}
          menus={this.filterMenus}
          hideBrowserView={false}
          horizontalLeft={true}
        />

        <ContextMenu
          show={this.state.showSortMenu}
          onClose={() => this.setState({showSortMenu: false})}
          pos={this.sortMenuPos}
          menus={this.sortMenus}
          hideBrowserView={false}
          horizontalLeft={true}
        />
      </Root>
    );
  }

  renderNormalMode() {
    if (!this.props.stream) return;
    if (this.state.mode !== 'normal') return;

    return (
      <NormalModeRoot onDoubleClick={() => this.setState({mode: 'filter', autoFocusFilter: true})}>
        <StreamNameWrap>
          <StreamName singleLine={true}>{this.props.stream.name}</StreamName>
          <IssueCount>{this.props.issueCount} issues</IssueCount>
        </StreamNameWrap>
        <IconButton name='sort' onClick={ev => this.handleShowSortMenu(ev)} style={{padding: space.small}}/>
        <IconButton name='filter-menu-outline' onClick={ev => this.handleShowFilterMenu(ev)} color={this.state.filterQueries.length > 0 ? appTheme().accent.normal : appTheme().icon.normal}/>
      </NormalModeRoot>
    );
  }

  renderFilterMode() {
    if (!this.props.stream) return;
    if (this.state.mode !== 'filter') return;

    const textInputViews = this.state.filterQueries.map((filterQuery, index) => {
      return (
        <TextInput
          key={index}
          ref={ref => this.textInput = ref}
          value={filterQuery}
          onChange={t => this.handleSetFilter(t, index)}
          onClear={() => this.handleSetFilter('', index, () => this.handleExecFilter(index))}
          onEnter={() => this.handleExecFilter(index)}
          onEscape={() => this.setState({mode: 'normal'})}
          onSelectCompletion={t => this.handleSetFilter(t, index, () => this.handleExecFilter(index))}
          onFocusCompletion={t => this.handleSetFilter(t, index)}
          placeholder='is:open octocat'
          completions={this.state.filterHistories}
          showClearButton='ifNeed'
          autoFocus={this.state.autoFocusFilter}
          style={{marginBottom: space.small}}
        />
      )
    });

    return (
      <React.Fragment>
        <StreamNameRow>
          <StreamName singleLine={true}>{this.props.stream.name}</StreamName>
          <IssueCount style={{paddingLeft: space.small}}>{this.props.issueCount} issues</IssueCount>
        </StreamNameRow>
        <FilterModeRoot>
          <TextInputWrap>
            {textInputViews}
          </TextInputWrap>
          <View style={{paddingLeft: space.medium}}/>
          <IconButton name='filter-menu-outline' onClick={ev => this.handleShowFilterMenu(ev)} color={this.state.filterQueries.length > 0 ? appTheme().accent.normal : appTheme().icon.normal}/>
        </FilterModeRoot>
      </React.Fragment>
    );
  }
}

const Root = styled(DraggableHeader)`
  flex-direction: column;
  justify-content: center;
  padding: ${space.medium}px;
  border-bottom: solid ${border.medium}px ${() => appTheme().border.normal};
  
  /* filter historyを表示するため */
  overflow: visible;
`;

// normal mode
const NormalModeRoot = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  width: 100%;
`;

const StreamNameWrap = styled(View)`
  flex: 1;
`;

const StreamName = styled(Text)`
  font-weight: ${fontWeight.bold};
`;

const IssueCount = styled(Text)`
  font-size: ${font.tiny}px;
  color: ${() => appTheme().text.soft};
`;

// filter mode
const FilterModeRoot = styled(View)`
  width: 100%;
  flex-direction: row;
  align-items: flex-start;
  /* filter historyを表示するため */
  overflow: visible;
`;

const TextInputWrap = styled(View)`
  flex: 1;
  /* filter historyを表示するため */
  overflow: visible;
`;

const StreamNameRow = styled(View)`
  flex-direction: row;
  flex: 1;
  width: 100%;
  align-items: center;
  padding-bottom: ${space.small}px;
`;
