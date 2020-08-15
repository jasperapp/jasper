import React, {CSSProperties} from 'react';
import {ButtonGroup} from '../../Component/Core/ButtonGroup';
import {Button} from '../../Component/Core/Button';
import {Icon} from '../../Component/Core/Icon';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {space} from '../../Style/layout';
import {TextInput} from '../../Component/Core/TextInput';
import {appTheme} from '../../Style/appTheme';
import {Text} from '../../Component/Core/Text';

type Props = {
  searchKeyword: string;
  searchMatchCount: number | null;
  searchActiveNumber: number | null;
  onSearchKeywordChange: (keyword: string) => void;
  onSearchNext: () => void;
  onSearchPrev: () => void;
  onSearchEnd: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class BrowserSearchBarFragment extends React.Component<Props, State> {
  private textInput: TextInput;

  componentDidMount() {
    this.textInput?.focus();
    this.textInput?.select();
  }

  render() {
    return (
      <Root className={this.props.className} style={this.props.style}>
        <SearchBarWrap>
          <SearchInput
            value={this.props.searchKeyword}
            onChange={t => this.props.onSearchKeywordChange(t)}
            onEnter={(ev) => ev.shiftKey ? this.props.onSearchPrev() : this.props.onSearchNext()}
            onEscape={() => this.props.onSearchEnd()}
            onClick={() => this.textInput.select()}
            ref={ref => this.textInput = ref}
          />
          {this.renderSearchCount()}
        </SearchBarWrap>

        <ButtonGroup>
          <Button onClick={() => this.props.onSearchPrev()} title='Search Previous'>
            <Icon name='chevron-up'/>
          </Button>
          <Button onClick={() => this.props.onSearchNext()} title='Search Next'>
            <Icon name='chevron-down'/>
          </Button>
          <Button onClick={() => this.props.onSearchEnd()} title='Search Finish'>
            <Icon name='close'/>
          </Button>
        </ButtonGroup>
      </Root>
    );
  }

  renderSearchCount() {
    if (this.props.searchMatchCount === null) return;
    return (
      <SearchCountWrap>
        <SearchCount>{this.props.searchActiveNumber}</SearchCount>
        <SearchCount style={{paddingLeft: space.small, paddingRight: space.small}}>/</SearchCount>
        <SearchCount>{this.props.searchMatchCount}</SearchCount>
      </SearchCountWrap>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium}px;
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
