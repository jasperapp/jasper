import React, {CSSProperties} from 'react';
import {IssueEntity} from '../Type/IssueEntity';
import {View} from './View';
import {ClickView} from './ClickView';
import styled, {keyframes} from 'styled-components';
import {IconNameType} from '../Type/IconNameType';
import {color} from '../Style/color';
import {Icon} from './Icon';
import {Text} from './Text';
import {border, font, fontWeight, icon, iconFont, space} from '../Style/layout';
import {Image} from './Image';
import {appTheme} from '../Style/appTheme';
import {ColorUtil} from '../Util/ColorUtil';
import {GitHubUtil} from '../Util/GitHubUtil';
import {IssueRepo} from '../../Repository/IssueRepo';
import {DateUtil} from '../Util/DateUtil';
import {clipboard, shell} from 'electron';
import {ContextMenu, ContextMenuType} from './ContextMenu';
import ReactDOM from 'react-dom';

type Props = {
  issue: IssueEntity;
  selected: boolean;
  fadeIn?: boolean;
  disableMenu?: boolean;
  slim?: boolean;
  skipHandlerSameCheck: boolean;
  onSelect: (issue: IssueEntity) => void;
  onReadAll?: (issue: IssueEntity) => void;
  onReadCurrentAll?: (issue: IssueEntity) => void;
  onUnsubscribe?: (issue: IssueEntity) => void | null;
  onToggleMark?: (issue: IssueEntity) => void;
  onToggleArchive?: (issue: IssueEntity) => void;
  onToggleRead?: (issue: IssueEntity) => void;
  onToggleIssueType?: (issue: IssueEntity) => void;
  onToggleMilestone?: (issue: IssueEntity) => void;
  onToggleLabel?: (issue: IssueEntity, label: string) => void;
  onToggleAuthor?: (issue: IssueEntity) => void;
  onToggleAssignee?: (issue: IssueEntity, assignee: string) => void;
  onToggleRepoOrg?: (issue: IssueEntity) => void;
  onToggleRepoName?: (issue: IssueEntity) => void;
  onToggleIssueNumber?: (issue: IssueEntity) => void;
  onCreateFilterStream?: (issue: IssueEntity) => void;
  className?: string;
}

type State = {
  showMenu: boolean;
}

export class IssueRow extends React.Component<Props, State> {
  state: State = {
    showMenu: false,
  }

  private menus: ContextMenuType[] = [];
  private contextMenuPos: {left: number; top: number};

  shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _nextContext: any): boolean {
    if (nextState.showMenu !== this.state.showMenu) return true;

    if (nextProps.issue !== this.props.issue) return true;
    if (nextProps.issue.read_at !== this.props.issue.read_at) return true;
    if (nextProps.issue.closed_at !== this.props.issue.closed_at) return true;
    if (nextProps.issue.marked_at !== this.props.issue.marked_at) return true;
    if (nextProps.issue.archived_at !== this.props.issue.archived_at) return true;
    if (nextProps.issue.updated_at !== this.props.issue.updated_at) return true;
    if (nextProps.issue.merged_at !== this.props.issue.merged_at) return true;

    if (nextProps.selected !== this.props.selected) return true;
    if (nextProps.fadeIn !== this.props.fadeIn) return true;
    if (nextProps.className !== this.props.className) return true;
    if (nextProps.slim !== this.props.slim) return true;

    // handlerは基本的に毎回新しく渡ってくるので、それをチェックしてしまうと、毎回renderすることになる
    // なので、明示的にsame check指示されたときのみチェックする
    if (!nextProps.skipHandlerSameCheck) {
      if (nextProps.onSelect !== this.props.onSelect) return true;
      if (nextProps.onReadAll !== this.props.onReadAll) return true;
      if (nextProps.onReadCurrentAll !== this.props.onReadCurrentAll) return true;
      if (nextProps.onUnsubscribe !== this.props.onUnsubscribe) return true;
      if (nextProps.onToggleMark !== this.props.onToggleMark) return true;
      if (nextProps.onToggleArchive !== this.props.onToggleArchive) return true;
      if (nextProps.onToggleRead !== this.props.onToggleRead) return true;
      if (nextProps.onToggleIssueType !== this.props.onToggleIssueType) return true;
      if (nextProps.onToggleMilestone !== this.props.onToggleMilestone) return true;
      if (nextProps.onToggleLabel !== this.props.onToggleLabel) return true;
      if (nextProps.onToggleAuthor !== this.props.onToggleAuthor) return true;
      if (nextProps.onToggleAssignee !== this.props.onToggleAssignee) return true;
      if (nextProps.onToggleRepoOrg !== this.props.onToggleRepoOrg) return true;
      if (nextProps.onToggleRepoName !== this.props.onToggleRepoName) return true;
      if (nextProps.onToggleIssueNumber !== this.props.onToggleIssueNumber) return true;
      if (nextProps.onCreateFilterStream !== this.props.onCreateFilterStream) return true;
    }

    return false;
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 選択されたときには強制的に表示領域に入るようにする
    if (!prevProps.selected && this.props.selected) {
      const el = ReactDOM.findDOMNode(this) as HTMLDivElement;
      // @ts-ignore
      el.scrollIntoViewIfNeeded(false);
    }
  }

  private isOpenRequest(ev: React.MouseEvent): boolean {
    return !!(ev.shiftKey || ev.metaKey)
  }

  private handleContextMenu(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    const hideUnsubscribe = !this.props.onUnsubscribe;
    const isRead = IssueRepo.isRead(this.props.issue);
    const isBookmark = !!this.props.issue.marked_at;
    const isArchived = !!this.props.issue.archived_at;
    this.menus = [
      {label:  isRead? 'Mark as Unread' : 'Mark as Read', icon: isRead? 'clipboard-outline' : 'clipboard-check', handler: () => this.handleToggleRead()},
      {label:  isBookmark? 'Remove from Bookmark' : 'Add to Bookmark', icon: isBookmark? 'bookmark-outline' : 'bookmark', handler: () => this.handleToggleBookmark()},
      {label:  isArchived? 'Remove from Archive' : 'Move to Archive', icon: isArchived? 'archive-outline' : 'archive', handler: () => this.handleToggleArchive()},
      {type: 'separator', hide: hideUnsubscribe},
      {label: 'Unsubscribe', icon: 'volume-off', handler: () => this.handleUnsubscribe(), hide: hideUnsubscribe},
      {type: 'separator'},
      {label: 'Mark All Current as Read', icon: 'check', handler: () => this.handleReadCurrentAll()},
      {label: 'Mark All as Read', icon: 'check-all', handler: () => this.handleReadAll()},
      {type: 'separator'},
      {label: 'Open with Browser', icon: 'open-in-new', handler: () => this.handleOpenURL()},
      {type: 'separator'},
      {label: 'Copy as URL', icon: 'content-copy', handler: () => this.handleCopyURL()},
      {label: 'Copy as JSON', icon: 'code-json', handler: () => this.handleCopyValue()},
    ];

    if (this.props.onCreateFilterStream) {
      this.menus.push(
        {type: 'separator'},
        {label: 'Create Filter Stream', icon: 'file-tree', handler: () => this.handleCreateFilterStream()},
      );
    }

    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleSelect(ev: React.MouseEvent) {
    if (this.isOpenRequest(ev)) {
      shell.openExternal(this.props.issue.value.html_url);
      return;
    }

    this.props.onSelect(this.props.issue);
  }

  private handleClickIssueType() {
    this.props.onToggleIssueType?.(this.props.issue);
  }

  private handleClickMilestone() {
    this.props.onToggleMilestone?.(this.props.issue);
  }

  private handleClickLabel(label: string) {
    this.props.onToggleLabel?.(this.props.issue, label);
  }

  private handleClickAuthor() {
    this.props.onToggleAuthor?.(this.props.issue);
  }

  private handleClickAssignee(loginName: string) {
    this.props.onToggleAssignee?.(this.props.issue, loginName);
  }

  private handleClickRepoOrg() {
    this.props.onToggleRepoOrg?.(this.props.issue);
  }

  private handleClickRepoName() {
    this.props.onToggleRepoName?.(this.props.issue);
  }

  private handleClickIssueNumber() {
    this.props.onToggleIssueNumber?.(this.props.issue);
  }

  private handleToggleRead() {
    this.props.onToggleRead?.(this.props.issue);
  }

  private handleToggleBookmark() {
    this.props.onToggleMark?.(this.props.issue);
  }

  private handleToggleArchive() {
    this.props.onToggleArchive?.(this.props.issue);
  }

  private handleUnsubscribe() {
    this.props.onUnsubscribe?.(this.props.issue);
  }

  private handleReadCurrentAll() {
    this.props.onReadCurrentAll?.(this.props.issue);
  }

  private handleReadAll() {
    this.props.onReadAll?.(this.props.issue);
  }

  private handleOpenURL() {
    shell.openExternal(this.props.issue.value.html_url);
  }

  private handleCopyURL() {
    clipboard.writeText(this.props.issue.value.html_url);
  }

  private handleCopyValue() {
    clipboard.writeText(JSON.stringify(this.props.issue.value, null, 2));
  }

  private handleCreateFilterStream() {
    this.props.onCreateFilterStream?.(this.props.issue);
  }

  render() {
    const readClassName = IssueRepo.isRead(this.props.issue) ? 'issue-read' : 'issue-unread';
    const selectedClassName = this.props.selected ? 'issue-selected' : 'issue-unselected';
    const fadeInClassName = this.props.fadeIn ? 'issue-fadein' : '';
    const slimClassName = this.props.slim ? 'issue-slim' : ''

    return (
      <Root
        className={`${this.props.className} issue-row ${readClassName} ${selectedClassName} ${fadeInClassName} ${slimClassName}`}
        onClick={ev => this.handleSelect(ev)}
        onContextMenu={(ev) => this.handleContextMenu(ev)}
      >
        <LeftColumn>
          {this.renderUnreadBadge()}
        </LeftColumn>
        <RightColumn>
          {this.renderBody()}
          {this.renderAttributes()}
          {this.renderUsers()}
          {this.renderFooter()}
          {this.renderActions()}
        </RightColumn>

        <ContextMenu
          show={this.state.showMenu}
          onClose={() => this.setState({showMenu: false})}
          menus={this.menus}
          pos={this.contextMenuPos}
        />
      </Root>
    );
  }

  private renderUnreadBadge() {
    return (
      <UnreadBadge/>
    );
  }

  private renderBody() {
    const issue = this.props.issue;
    const selected = this.props.selected;
    const {icon: iconName, color: iconColor} = GitHubUtil.getIssueTypeInfo(issue);

    const style: CSSProperties = {};
    if (selected) style.background = iconColor;

    return (
      <Body>
        <IssueType
          onClick={() => this.handleClickIssueType()}
          style={style}
          title='Toggle Filter Issue/PR and Open/Closed'
        >
          <Icon name={iconName} color={selected ? color.white : iconColor} size={selected ? 20 : 26}/>
        </IssueType>
        <Title>
          <TitleText>{this.props.issue.value.title}</TitleText>
        </Title>
      </Body>
    );
  }

  private renderAttributes() {
    return (
      <Attributes>
        {this.renderMilestone()}
        {this.renderLabels()}
      </Attributes>
    );
  }

  private renderMilestone() {
    const milestone = this.props.issue.value.milestone;
    if (!milestone) return;

    return (
      <Milestone onClick={() => this.handleClickMilestone()} title='Toggle Filter Milestone'>
        <Icon name='flag-variant' size={iconFont.small}/>
        <MilestoneText>{milestone.title}</MilestoneText>
      </Milestone>
    );
  }

  private renderLabels() {
    const labels = this.props.issue.value.labels;
    if (!labels?.length) return;

    const labelViews = labels.map((label, index) => {
      const textColor = ColorUtil.suitTextColor(label.color);
      return (
        <Label key={index} style={{background: `#${label.color}`}} onClick={() => this.handleClickLabel(label.name)} title='Toggle Filter Label'>
          <LabelText style={{color: `#${textColor}`}}>{label.name}</LabelText>
        </Label>
      );
    });

    return (
      <React.Fragment>
        {labelViews}
      </React.Fragment>
    );
  }

  private renderUsers() {
    const updated  = DateUtil.localToString(new Date(this.props.issue.value.updated_at));
    const read = DateUtil.localToString(new Date(this.props.issue.read_at));
    const iconColor = this.props.selected ? color.white : appTheme().iconTinyColor;

    return (
      <Users>
        <Author onClick={() => this.handleClickAuthor()} title='Toggle Filter Author'>
          <Image source={{url: this.props.issue.value.user.avatar_url}}/>
        </Author>
        {this.renderAssignees()}
        <View style={{flex: 1}}/>

        <CommentCount title={`Updated at ${updated}\n      Read at ${read}`}>
          <Icon name='comment-text-outline' size={iconFont.tiny} color={iconColor}/>
          <CommentCountText>{this.props.issue.value.comments}</CommentCountText>
        </CommentCount>
      </Users>
    );
  }

  private renderAssignees() {
    const assignees = this.props.issue.value.assignees;
    if (!assignees?.length) return;

    const assigneeViews = assignees.map((assignee, index) => {
      return (
        <Assignee key={index} onClick={() => this.handleClickAssignee(assignee.login)} title='Toggle Filter Assignee'>
          <Image source={{url: assignee.avatar_url}}/>
        </Assignee>
      )
    });

    return (
      <React.Fragment>
        <AssigneeArrow>→</AssigneeArrow>
        {assigneeViews}
      </React.Fragment>
    );
  }

  private renderFooter() {
    const {repoOrg, repoName} = GitHubUtil.getInfo(this.props.issue.value.url);

    const date = new Date(this.props.issue.value.updated_at);
    const updated  = DateUtil.localToString(date);
    const read = DateUtil.localToString(new Date(this.props.issue.read_at));

    const iconColor = this.props.selected ? color.white : appTheme().iconTinyColor;
    let bookmarkIcon;
    if (this.props.issue.marked_at) {
      bookmarkIcon = (
        <BookmarkWrap title='Toggle Filter Bookmark'>
          <Icon name='bookmark' size={iconFont.tiny} color={iconColor}/>
        </BookmarkWrap>
      );
    }

    return (
      <Footer>
        <RepoName>
          <ClickView onClick={() => this.handleClickRepoOrg()} title='Toggle Filter Organization'>
            <RepoNameText>{repoOrg}</RepoNameText>
          </ClickView>
          <ClickView onClick={() => this.handleClickRepoName()} title='Toggle Filter Repository'>
            <RepoNameText>/{repoName}</RepoNameText>
          </ClickView>
          <Number onClick={() => this.handleClickIssueNumber()} title='Toggle Filter Issue Number'>
            <NumberText>#{this.props.issue.value.number}</NumberText>
          </Number>
        </RepoName>

        <View style={{flex: 1}}/>

        <UpdatedAt title={`Updated at ${updated}\n      Read at ${read}`}>
          <UpdatedAtText>{DateUtil.fromNow(date)}</UpdatedAtText>
        </UpdatedAt>
        {bookmarkIcon}
      </Footer>
    );
  }

  private renderActions() {
    if (this.props.disableMenu) return;

    const readIconName: IconNameType = IssueRepo.isRead(this.props.issue) ? 'clipboard-check' : 'clipboard-outline';
    const markIconName: IconNameType = this.props.issue.marked_at ? 'bookmark' : 'bookmark-outline';
    const archiveIconName: IconNameType = this.props.issue.archived_at ? 'archive' : 'archive-outline';

    return (
      <Actions>
        <Action onClick={() => this.handleToggleRead()} title={`${IssueRepo.isRead(this.props.issue) ? 'Mark as Unread' : 'Mark as Read'}`}>
          <ActionIcon name={readIconName} size={iconFont.small}/>
        </Action>

        <Action onClick={() => this.handleToggleBookmark()} title={`${this.props.issue.marked_at ? 'Remove from Bookmark' : 'Add to Bookmark'}`}>
          <ActionIcon name={markIconName} size={iconFont.small}/>
        </Action>

        <Action onClick={() => this.handleToggleArchive()} title={`${this.props.issue.archived_at ? 'Remove from Archive' : 'Move to Archive'}`}>
          <ActionIcon name={archiveIconName} size={iconFont.small}/>
        </Action>
        <Action onClick={() => this.handleCopyURL()} title='Copy Issue URL'>
          <ActionIcon name='content-copy' size={iconFont.small}/>
        </Action>
      </Actions>
    )
  }
}

const fadein = keyframes`
  from {
    opacity: 0.2;
  }
  to {
    opacity: 1;
  }
`;

const Root = styled(ClickView)`
  position: relative;
  flex-direction: row;
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  padding-bottom: ${space.medium}px;
  
  &.issue-unread {
  }
  
  &.issue-read {
    background: ${() => appTheme().issueReadBgColor};
  }
  
  &.issue-selected {
    background: ${color.blue};
  }
  
  &.issue-unselected {
  }
  
  &.issue-fadein {
    animation: ${fadein} 1s;
  }
`;

const LeftColumn = styled(View)`
  padding-top: ${space.medium}px;
  
  .issue-selected:not(.issue-slim) & {
    display: none;
  }
`;

const RightColumn = styled(View)`
  padding: ${space.medium}px ${space.medium}px 0;
  flex: 1;
`;

// unread badge
const UnreadBadge = styled(View)`
  width: 8px;
  height: 8px;
  border-radius: 100px;
  margin-left: ${space.small2}px;
  margin-top: ${space.small}px;

  .issue-unread & {
    background: ${color.blue};
  }

  .issue-read & {
    background: ${() => appTheme().borderBold + '44'};
  }

  .issue-selected & {
    visibility: hidden;
  }
`;

// body
const Body = styled(View)`
  flex-direction: row;
  width: 100%;
  
  .issue-slim & {
    padding-bottom: ${space.medium}px;
  }
`;

const IssueType = styled(ClickView)`
  border-radius: 100px;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 0.7;
  }
`;

const Title = styled(View)`
  flex: 1;
  min-height: 52px;
  padding-left: ${space.medium}px;
  padding-right: ${space.medium}px;
  
  .issue-slim & {
    min-height: initial;
  }
`;

const TitleText = styled(Text)`
  .issue-unread & {
    font-weight: ${fontWeight.bold};
  }
  
  .issue-read & {
    color: ${() => appTheme().textSoftColor};
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;

// attributes
const Attributes = styled(View)`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`;

const Milestone = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  background: ${() => appTheme().bg};
  border: solid ${border.medium}px ${() => appTheme().borderBold};
  border-radius: 4px;
  padding: 0 ${space.small}px;
  margin-right: ${space.medium}px;
  margin-bottom: ${space.medium}px;
  
  &:hover {
    opacity: 0.7;
  }
  
  .issue-selected & {
    opacity: 0.8;
  }
`;

const MilestoneText = styled(Text)`
  font-size: ${font.small}px;
`;

const Label = styled(ClickView)`
  border-radius: 4px;
  padding: 0 ${space.small}px;
  margin-right: ${space.medium}px;
  margin-bottom: ${space.medium}px;
  
  &:hover {
    opacity: 0.7;
  }
  
  .issue-selected & {
    opacity: 0.8;
  }
`;

const LabelText = styled(Text)`
  font-size: ${font.small}px;
`;

// users
const Users = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-top: ${space.medium}px;
`;

const Author = styled(ClickView)`
  width: ${icon.small2}px;
  height: ${icon.small2}px;
  border-radius: 100%;
  
  &:hover {
    opacity: 0.7;
  }
`;

const Assignee = styled(ClickView)`
  width: ${icon.small2}px;
  height: ${icon.small2}px;
  border-radius: 100%;
  margin-right: ${space.small}px;
  
  &:hover {
    opacity: 0.7;
  }
`;

const AssigneeArrow = styled(Text)`
  font-size: ${font.small}px;
  margin: 0 ${space.small}px;
  font-weight: ${fontWeight.bold};
  
  .issue-selected & {
    color: ${color.white};
  }
`;

// footer
const Footer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-top: ${space.medium}px;
`;

const RepoName = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const RepoNameText = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textTinyColor};
  
  /* 文字がはみ出ないようにする */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-all;
  
  &:hover {
    opacity: 0.7;
  }
  
  .issue-read & {
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;

const Number = styled(ClickView)`
  padding-left: ${space.small}px;
`;

const NumberText = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textTinyColor};
  
  &:hover {
    opacity: 0.7;
  }
  
  .issue-read & {
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;

const CommentCount = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-left: ${space.small2}px;
  position: relative;
  top: 4px;
`;

const CommentCountText = styled(Text)`
  font-size: ${font.tiny}px;
  color: ${() => appTheme().textTinyColor};
  padding-left: ${space.tiny}px;
  
  .issue-read & {
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;

const UpdatedAt = styled(View)`
  padding-left: ${space.small}px;
`;

const UpdatedAtText = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textTinyColor};
  
  /* 文字がはみ出ないようにする */
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-break: break-all;
  
  .issue-read & {
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;

const BookmarkWrap = styled(View)`
  position: relative;
  top: 2px;
  padding-left: ${space.small}px;
`;

const Actions = styled(View)`
  display: none;
  position: absolute;
  bottom: ${space.small2}px;
  right: ${space.small2}px;
  background: ${() => appTheme().bg};
  border-radius: 4px;
  padding: 0 ${space.small}px;
  flex-direction: row;
  align-items: center;
  box-shadow: 0 0 4px 1px #00000010;
  
  .issue-row:hover & {
    display: flex; 
  }
`;

const Action = styled(ClickView)`
  padding: ${space.small}px ${space.small}px;
`;

const ActionIcon = styled(Icon)`
  &:hover {
    opacity: 0.7;
  }
`;
