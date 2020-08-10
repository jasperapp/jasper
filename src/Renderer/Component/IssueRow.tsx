import React, {CSSProperties} from 'react';
import ReactDOM from 'react-dom';
import {IssueEntity} from '../Type/IssueEntity';
import {View} from './Core/View';
import {ClickView} from './Core/ClickView';
import styled, {keyframes} from 'styled-components';
import {IconNameType} from '../Type/IconNameType';
import {color} from '../Style/color';
import {Icon} from './Core/Icon';
import {Text} from './Core/Text';
import {border, font, fontWeight, icon, iconFont, space} from '../Style/layout';
import {Image} from './Core/Image';
import {appTheme} from '../Style/appTheme';
import {ColorUtil} from '../Util/ColorUtil';
import {GitHubUtil} from '../Util/GitHubUtil';
import {IssueRepo} from '../Repository/IssueRepo';
import {DateUtil} from '../Util/DateUtil';
import {shell} from 'electron';
import {ContextMenu, ContextMenuType} from './Core/ContextMenu';

type Props = {
  issue: IssueEntity;
  menus: ContextMenuType[],
  selected?: boolean;
  fadeIn?: boolean;
  onSelect?: (issue: IssueEntity) => void;
  onIssueType?: (issue: IssueEntity) => void;
  onMilestone?: (issue: IssueEntity) => void;
  onLabel?: (issue: IssueEntity, label: string) => void;
  onAuthor?: (issue: IssueEntity) => void;
  onAssignee?: (issue: IssueEntity, assignee: string) => void;
  onRepoOrg?: (issue: IssueEntity) => void;
  onRepoName?: (issue: IssueEntity) => void;
  onIssueNumber?: (issue: IssueEntity) => void;
  onToggleBookmark?: (issue: IssueEntity) => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
  showMenu: boolean;
}

export class IssueRow extends React.Component<Props, State> {
  state: State = {
    showMenu: false,
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // ショートカットキーJ/Kでissueを選択したとき、隠れている場合がある。
    // なので、選択状態に変わったときだけ、scrollIntoViewIfNeededで表示させる。
    if (!prevProps.selected && this.props.selected) {
      const el = ReactDOM.findDOMNode(this);
      el.scrollIntoViewIfNeeded(true);
    }
  }

  private isRequestOpen(ev: React.MouseEvent): boolean {
    return !!(ev.shiftKey || ev.metaKey)
  }

  // todo: これを上位に伝える
  private getOperationType(ev: React.MouseEvent): 'replace' | 'remove' | 'append' {
    if (ev.metaKey || ev.ctrlKey) {
      return 'replace';
    } else if (ev.shiftKey) { // remove
      return 'remove';
    } else {
      return 'append';
    }
  }

  private handleSelect(ev: React.MouseEvent) {
    if (this.isRequestOpen(ev)) {
      shell.openExternal(this.props.issue.value.html_url);
      return;
    }

    this.props.onSelect?.(this.props.issue);
  }

  private handleClickIssueType() {
    this.props.onIssueType?.(this.props.issue);
  }

  private handleClickMilestone() {
    this.props.onMilestone?.(this.props.issue);
  }

  private handleClickLabel(label: string) {
    this.props.onLabel?.(this.props.issue, label);
  }

  private handleClickAuthor() {
    this.props.onAuthor?.(this.props.issue);
  }

  private handleClickAssignee(loginName: string) {
    this.props.onAssignee?.(this.props.issue, loginName);
  }

  private handleClickBookmark() {
    this.props.onToggleBookmark?.(this.props.issue);
  }

  private handleClickRepoOrg() {
    this.props.onRepoOrg?.(this.props.issue);
  }

  private handleClickRepoName() {
    this.props.onRepoName?.(this.props.issue);
  }

  private handleClickIssueNumber() {
    this.props.onIssueNumber?.(this.props.issue);
  }

  render() {
    const readClassName = IssueRepo.isRead(this.props.issue) ? 'issue-read' : 'issue-unread';
    const selectedClassName = this.props.selected ? 'issue-selected' : 'issue-unselected';
    const fadeInClassName = this.props.fadeIn ? 'issue-fadein' : '';

    return (
      <Root
        className={`${this.props.className} ${readClassName} ${selectedClassName} ${fadeInClassName}`}
        style={this.props.style}
        onClick={ev => this.handleSelect(ev)}
        onContextMenu={() => this.setState({showMenu: true})}
      >
        <Body>
          {this.renderIssueType()}
          {this.renderTitle()}
        </Body>
        <Attributes>
          {this.renderMilestone()}
          {this.renderLabels()}
        </Attributes>
        <Users>
          {this.renderAuthor()}
          {this.renderAssignees()}
        </Users>
        <Footer>
          {this.renderBookmark()}
          {this.renderRepoName()}
          {this.renderNumber()}
          {this.renderUpdatedAt()}
          {this.renderCommentCount()}
        </Footer>

        <ContextMenu
          show={this.state.showMenu}
          onClose={() => this.setState({showMenu: false})}
          menus={this.props.menus}
        />
      </Root>
    );
  }

  private renderIssueType() {
    const issue = this.props.issue;
    const iconName: IconNameType = issue.value.pull_request ? 'source-pull' : 'alert-circle-outline';
    const iconColor = issue.value.closed_at ? color.issue.closed : color.issue.open;
    return (
      <IssueType onClick={() => this.handleClickIssueType()} title='filter issue/pr and open/closed'>
        <Icon name={iconName} color={iconColor} size={26}/>
      </IssueType>
    );
  }

  private renderTitle() {
    return (
      <Title>
        <TitleText>{this.props.issue.value.title}</TitleText>
      </Title>
    );
  }

  private renderMilestone() {
    const milestone = this.props.issue.value.milestone;
    if (!milestone) return;

    return (
      <Milestone onClick={() => this.handleClickMilestone()} title='filter milestone'>
        <Icon name='sign-direction' size={iconFont.small}/>
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
        <Label key={index} style={{background: `#${label.color}`}} onClick={() => this.handleClickLabel(label.name)} title='filter label'>
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

  private renderAuthor() {
    return (
      <Author onClick={() => this.handleClickAuthor()} title='filter author'>
        <Image source={{url: this.props.issue.value.user.avatar_url}}/>
      </Author>
    );
  }

  private renderAssignees() {
    const assignees = this.props.issue.value.assignees;
    if (!assignees?.length) return;

    const assigneeViews = assignees.map((assignee, index) => {
      return (
        <Assignee key={index} onClick={() => this.handleClickAssignee(assignee.login)} title='filter assignee'>
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

  private renderBookmark() {
    const iconName: IconNameType = this.props.issue.marked_at ? 'bookmark' : 'bookmark-outline';
    return (
      <Bookmark onClick={() => this.handleClickBookmark()} title='toggle bookmark'>
        <BookmarkIcon name={iconName} size={iconFont.medium}/>
      </Bookmark>
    );
  }

  private renderRepoName() {
    const {repoOrg, repoName} = GitHubUtil.getInfo(this.props.issue.value.url);

    return (
      <RepoName>
        <ClickView onClick={() => this.handleClickRepoOrg()} title='filter organization'>
          <RepoNameText>{repoOrg}</RepoNameText>
        </ClickView>
        <ClickView onClick={() => this.handleClickRepoName()} title='filter repository'>
          <RepoNameText>/{repoName}</RepoNameText>
        </ClickView>
      </RepoName>
    );
  }

  private renderNumber() {
    return (
      <Number onClick={() => this.handleClickIssueNumber()} title='filter issue number'>
        <NumberText>#{this.props.issue.value.number}</NumberText>
      </Number>
    );
  }

  private renderUpdatedAt() {
    const date = new Date(this.props.issue.value.updated_at);
    const title = DateUtil.localToString(date);
    return (
      <UpdatedAt title={title}>
        <UpdatedAtText>{DateUtil.fromNow(date)}</UpdatedAtText>
      </UpdatedAt>
    );
  }

  private renderCommentCount() {
    const date = new Date(this.props.issue.value.updated_at);
    const iconColor = this.props.selected ? color.white : appTheme().iconTinyColor;
    return (
      <CommentCount title={DateUtil.fromNow(date)}>
        <Icon name='comment-text-outline' size={iconFont.tiny} color={iconColor}/>
        <CommentCountText>{this.props.issue.value.comments}</CommentCountText>
      </CommentCount>
    );
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
  /* todo: なぜかこれがないと高さが確保できない。リファクタリング終わったら調査する */
  min-height: fit-content;
  
  border-bottom: solid ${border.medium}px ${() => appTheme().borderColor};
  
  &.issue-unread {
  }
  
  &.issue-read {
    background: ${() => appTheme().issueReadBgColor};
  }
  
  &.issue-selected {
    background: ${() => appTheme().issueSelectedColor};
  }
  
  &.issue-unselected {
  }
  
  &.issue-fadein {
    animation: ${fadein} 1s;
  }
`;

// body
const Body = styled(View)`
  flex-direction: row;
  width: 100%;
`;

const IssueType = styled(ClickView)`
  padding-top: ${space.medium}px;
  padding-left: ${space.medium}px;
  
  &:hover {
    opacity: 0.7;
  }
`;

const Title = styled(View)`
  flex: 1;
  min-height: 52px;
  padding-top: ${space.medium}px;
  padding-left: ${space.small}px;
  padding-right: ${space.medium}px;
`;

const TitleText = styled(Text)`
  font-size: ${font.small}px;
  
  .issue-unread & {
    font-weight: ${fontWeight.bold};
  }
  
  .issue-read & {
    color: ${() => appTheme().textTinyColor};
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
    font-weight: ${fontWeight.medium};
  }
`;

// attributes
const Attributes = styled(View)`
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  padding: 0 ${space.medium}px;
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
  padding: ${space.medium}px ${space.medium}px 0;
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
  
  .issue-selected & {
    color: ${color.white};
  }
`;

// footer
const Footer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium2}px ${space.medium}px ${space.medium}px ${space.small2}px;
`;

const Bookmark = styled(ClickView)`
  padding-bottom: 1px;
`;

const BookmarkIcon = styled(Icon)`
  color: ${() => appTheme().iconTinyColor};
  
  &:hover {
    opacity: 0.7;
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;

const RepoName = styled(View)`
  padding-left: ${space.small}px;
  flex-direction: row;
  align-items: center;
  flex: 1;
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
  
  .issue-read & {
    font-weight: ${fontWeight.thin};
  }
  
  .issue-selected & {
    color: ${color.white};
  }
`;
