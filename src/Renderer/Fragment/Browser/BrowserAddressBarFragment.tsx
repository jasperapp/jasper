import React, {CSSProperties} from 'react';
import {Icon} from '../../Component/Core/Icon';
import {Button} from '../../Component/Core/Button';
import {TextInput} from '../../Component/Core/TextInput';
import {shell} from 'electron';
import {IconNameType} from '../../Type/IconNameType';
import {IssueRepo} from '../../Repository/IssueRepo';
import {IssueEntity} from '../../Type/IssueEntity';
import styled from 'styled-components';
import {View} from '../../Component/Core/View';
import {ButtonGroup} from '../../Component/Core/ButtonGroup';
import {border, space} from '../../Style/layout';
import {appTheme} from '../../Style/appTheme';
import {color} from '../../Style/color';

type Props = {
  issue: IssueEntity;
  url: string;
  loading: boolean;
  onGoBack: () => void | null;
  onGoForward: () => void | null;
  onReload: (url: string) => void | null;
  onChangeURL: (url: string) => void;
  onLoadURL: (url: string) => void;
  onToggleRead: (issue: IssueEntity) => void;
  onToggleMark: (issue: IssueEntity) => void;
  onToggleArchive: (issue: IssueEntity) => void;
  onSearchStart: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class BrowserAddressBarFragment extends React.Component<Props, State> {
  private urlTextInput: TextInput;

  focus() {
    this.urlTextInput?.focus();
    this.urlTextInput?.select();
  }

  private handleOpenURL() {
    shell.openExternal(this.props.url);
  }

  render() {
    const loadingClassName = this.props.loading ? 'toolbar-loading' : '';

    return (
      <Root className={`${loadingClassName} ${this.props.className}`} style={this.props.style}>
        {this.renderBrowserLoadActions()}
        {this.renderAddressBar()}
        {this.renderIssueActions()}
        {this.renderBrowserSubActions()}
      </Root>
    );
  }

  renderBrowserLoadActions() {
    const goBarkEnable = this.props.url && this.props.onGoBack;
    const goForwardEnable = this.props.url && this.props.onGoForward;
    const reloadEnable = !!this.props.url;

    return (
      <ButtonGroup>
        <Button onClick={() => this.props.onGoBack?.()} title='Go Back' disable={!goBarkEnable}>
          <Icon name='arrow-left-bold'/>
        </Button>
        <Button onClick={() => this.props.onGoForward?.()} title='Go Forward' disable={!goForwardEnable}>
          <Icon name='arrow-right-bold'/>
        </Button>
        <Button onClick={() => this.props.onReload(this.props.url)} title='Reload' disable={!reloadEnable}>
          <Icon name='reload'/>
        </Button>
      </ButtonGroup>
    )
  }

  renderAddressBar() {
    return (
      <AddressBarWrap>
        <AddressBar
          value={this.props.url}
          onChange={t => this.props.onChangeURL(t)}
          onEnter={() => this.props.onLoadURL(this.props.url)}
          onClick={() => this.urlTextInput.select()}
          ref={ref => this.urlTextInput = ref}
        />
      </AddressBarWrap>
    )
  }

  renderIssueActions() {
    const readIconName: IconNameType = IssueRepo.isRead(this.props.issue) ? 'clipboard-check' : 'clipboard-outline';
    const markIconName: IconNameType = this.props.issue?.marked_at ? 'bookmark' : 'bookmark-outline';
    const archiveIconName: IconNameType = this.props.issue?.archived_at ? 'archive' : 'archive-outline';

    return (
      <ButtonGroup>
        <Button onClick={() => this.props.onToggleRead(this.props.issue)} title={`${IssueRepo.isRead(this.props.issue) ? 'Mark as Unread' : 'Mark as Read'}`}>
          <Icon name={readIconName}/>
        </Button>
        <Button onClick={() => this.props.onToggleMark(this.props.issue)} title={`${this.props.issue?.marked_at ? 'Remove from Bookmark' : 'Add to Bookmark'}`}>
          <Icon name={markIconName}/>
        </Button>
        <Button onClick={() => this.props.onToggleArchive(this.props.issue)} title={`${this.props.issue?.archived_at ? 'Remove from Archive' : 'Move to Archive'}`}>
          <Icon name={archiveIconName}/>
        </Button>
      </ButtonGroup>
    );
  }

  renderBrowserSubActions() {
    return (
      <ButtonGroup style={{marginLeft: space.medium}}>
        <Button onClick={() => this.props.onSearchStart()} title='Search Keyword in Page'>
          <Icon name='text-box-search-outline'/>
        </Button>
        <Button onClick={() => this.handleOpenURL()} title='Open URL with External Browser'>
          <Icon name='open-in-new'/>
        </Button>
      </ButtonGroup>
    );
  }
}

const Root = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium}px;
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
`;

// address bar
const AddressBarWrap = styled(View)`
  flex: 1;
  padding: 0 ${space.medium}px;
`;

const AddressBar = styled(TextInput)`
  border-radius: 50px;
  background: ${() => appTheme().browserAddressBarColor};
  
  .toolbar-loading & {
    background: ${color.blue};
    color: ${color.white};
  }
`;

