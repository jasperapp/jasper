import React, {CSSProperties} from 'react';
import {ButtonGroup} from '../../Component/Core/ButtonGroup';
import {Button} from '../../Component/Core/Button';
import {Icon} from '../../Component/Core/Icon';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {border, space} from '../../Style/layout';
import {TextInput} from '../../Component/Core/TextInput';
import {appTheme} from '../../Style/appTheme';
import {Text} from '../../Component/Core/Text';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';

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
  // onSearchKeywordChange: (keyword: string) => void;
  // onSearchNext: () => void;
  // onSearchPrev: () => void;
  // onSearchEnd: () => void;
}

export class BrowserSearchBarFragment extends React.Component<Props, State> {
  private textInput: TextInput;

  state: State = {
    searchKeyword: '',
    searchMatchCount: null,
    searchActiveNumber: null,
  }

  constructor(props) {
    super(props);
    this.setupSearchInPage();
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.show && !prevProps.show) {
      BrowserViewIPC.blur();
      this.textInput?.focus();
      this.textInput?.select();
    }
  }

  private setupSearchInPage() {
    // BrowserViewIPC.onEventBeforeInput((input)=>{
    //   if (input.type !== 'keyDown') return;
    //   if ((input.meta || input.control) && input.key === 'f') {
    //     this.handleSearchStart();
    //   }
    // });

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

        <ButtonGroup>
          <Button onClick={() => this.handleSearchPrev()} title='Search Previous'>
            <Icon name='chevron-up'/>
          </Button>
          <Button onClick={() => this.handleSearchNext()} title='Search Next'>
            <Icon name='chevron-down'/>
          </Button>
          <Button onClick={() => this.handleClose()} title='Search Close'>
            <Icon name='close'/>
          </Button>
        </ButtonGroup>
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

const Root = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium}px;
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  
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
  color: ${() => appTheme().textSoftColor};
`;
