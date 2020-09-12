import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {space} from '../../Library/Style/layout';
import {TextInput} from '../../Library/View/TextInput';
import {appTheme} from '../../Library/Style/appTheme';
import {Text} from '../../Library/View/Text';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {IconButton} from '../../Library/View/IconButton';
import {DraggableHeader} from '../../Library/View/DraggableHeader';
import {TrafficLightsSpace} from '../../Library/View/TrafficLightsSpace';

type Props = {
  show: boolean;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
  searchKeyword: string;
  searchMatchCount: number | null;
  searchActiveNumber: number | null;
}

export class BrowserSearchFragment extends React.Component<Props, State> {
  private textInput: TextInput;

  state: State = {
    searchKeyword: '',
    searchMatchCount: null,
    searchActiveNumber: null,
  }

  componentDidMount() {
    this.setupSearchInPage();

    // 表示されてる状態で再度cmd+fされたときに、フォーカスするように
    BrowserViewIPC.onStartSearch(() => this.focus());
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.show && !prevProps.show) this.focus();
  }

  private focus() {
    BrowserViewIPC.blur();
    this.textInput?.focus();
    this.textInput?.select();
  }

  private setupSearchInPage() {
    BrowserViewIPC.onEventFoundInPage((result) => {
      if (result.activeMatchOrdinal !== undefined) {
        this.setState({searchActiveNumber: result.activeMatchOrdinal});
      }

      if (result.finalUpdate) {
        if (result.matches === 0) {
          this.setState({searchActiveNumber: null, searchMatchCount: null});
        } else {
          this.setState({searchMatchCount: result.matches});
        }
      }
    });

    BrowserViewIPC.onEventDidNavigate(() => this.handleClose());
  }

  private handleClose() {
    BrowserViewIPC.stopFindInPage('keepSelection');
    BrowserViewIPC.focus();
    this.props.onClose();
  }

  private handleSearchKeywordChange(keyword: string) {
    if (keyword) {
      BrowserViewIPC.findInPage(keyword);
    } else {
      BrowserViewIPC.stopFindInPage('clearSelection');
      this.setState({searchActiveNumber: null, searchMatchCount: null});
    }

    this.setState({searchKeyword: keyword});
  }

  private handleSearchNext() {
    BrowserViewIPC.findInPage(this.state.searchKeyword, {findNext: true});
  }

  private handleSearchPrev() {
    BrowserViewIPC.findInPage(this.state.searchKeyword, {forward: false});
  }


  render() {
    const showClassName = this.props.show ? '' : 'search-bar-hide';
    return (
      <Root className={`${showClassName} ${this.props.className}`} style={this.props.style}>
        <TrafficLightsSpace/>
        <SearchBarWrap>
          <SearchInput
            value={this.state.searchKeyword}
            onChange={t => this.handleSearchKeywordChange(t)}
            onEnter={(ev) => ev.shiftKey ? this.handleSearchPrev() : this.handleSearchNext()}
            onEscape={() => this.handleClose()}
            onClick={() => this.textInput.select()}
            ref={ref => this.textInput = ref}
            autoFocus={true}
          />
          {this.renderSearchCount()}
        </SearchBarWrap>

        <IconButton name='chevron-up' onClick={() => this.handleSearchPrev()} title='Search Previous'/>
        <IconButton name='chevron-down' onClick={() => this.handleSearchNext()} title='Search Next'/>
        <IconButton name='close' onClick={() => this.handleClose()} title='Search Close'/>
      </Root>
    );
  }

  renderSearchCount() {
    if (this.state.searchMatchCount === null) return;
    return (
      <SearchCountWrap>
        <SearchCount>{this.state.searchActiveNumber}</SearchCount>
        <SearchCount style={{paddingLeft: space.small, paddingRight: space.small}}>/</SearchCount>
        <SearchCount>{this.state.searchMatchCount}</SearchCount>
      </SearchCountWrap>
    );
  }
}

const Root = styled(DraggableHeader)`
  padding: ${space.medium}px;
  
  &.search-bar-hide {
    display: none;
  }
`;

const SearchBarWrap = styled(View)`
  flex: 1;
  padding: 0 ${space.medium}px;
  position: relative;
`;

const SearchInput = styled(TextInput)`
  border-radius: 50px;
  background: ${() => appTheme().browserAddressBarColor};
`;

// count
const SearchCountWrap = styled(View)`
  position: absolute;
  top: 4px;
  right: 20px;
  flex-direction: row;
  align-items: center;
`;

const SearchCount = styled(Text)`
  color: ${() => appTheme().text.soft};
`;
