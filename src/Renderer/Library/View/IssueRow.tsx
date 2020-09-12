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
import {IconButton} from './IconButton';
import {PlatformUtil} from '../Util/PlatformUtil';
import {UserIcon} from './UserIcon';

type Props = {
  issue: IssueEntity;
  selected: boolean;
  fadeIn?: boolean;
  disableMenu?: boolean;
  slim?: boolean;
  scrollIntoViewIfNeededWithCenter: boolean;
  skipHandlerSameCheck: boolean;
  onSelect: (issue: IssueEntity) => void;
  onReadAll?: (issue: IssueEntity) => void;
  onReadCurrentAll?: (issue: IssueEntity) => void;
  onUnsubscribe?: (issue: IssueEntity) => void | null;
  onToggleMark?: (issue: IssueEntity) => void;
  onToggleArchive?: (issue: IssueEntity) => void;
  onToggleRead?: (issue: IssueEntity) => void;
  onToggleIssueType?: (issue: IssueEntity) => void;
  onToggleProject?: (issue: IssueEntity, projectName: string, projectColumn: string) => void;
  onToggleMilestone?: (issue: IssueEntity) => void;
  onToggleLabel?: (issue: IssueEntity, label: string) => void;
  onToggleAuthor?: (issue: IssueEntity) => void;
  onToggleAssignee?: (issue: IssueEntity, assignee: string) => void;
  onToggleReviewRequested?: (issue: IssueEntity, loginName: string) => void;
  onToggleReview?: (issue: IssueEntity, loginName: string) => void;
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

  private contextMenus: ContextMenuType[] = [];
  private contextMenuPos: {left: number; top: number};
  private contextMenuHorizontalLeft: boolean;
  private contextMenuHideBrowserView: boolean;

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
    if (nextProps.scrollIntoViewIfNeededWithCenter !== this.props.scrollIntoViewIfNeededWithCenter) return true;

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
      if (nextProps.onToggleProject !== this.props.onToggleProject) return true;
      if (nextProps.onToggleMilestone !== this.props.onToggleMilestone) return true;
      if (nextProps.onToggleLabel !== this.props.onToggleLabel) return true;
      if (nextProps.onToggleAuthor !== this.props.onToggleAuthor) return true;
      if (nextProps.onToggleAssignee !== this.props.onToggleAssignee) return true;
      if (nextProps.onToggleReviewRequested !== this.props.onToggleReviewRequested) return true;
      if (nextProps.onToggleReview !== this.props.onToggleReview) return true;
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
      el.scrollIntoViewIfNeeded(this.props.scrollIntoViewIfNeededWithCenter);
    }
  }

  private isOpenRequest(ev: React.MouseEvent): boolean {
    return !!(ev.shiftKey || ev.metaKey)
  }

  // private isToggleRequest(ev: React.MouseEvent): boolean {
  //   return ev.altKey;
  // }

  private openPath(path: string) {
    const urlObj = new URL(this.props.issue.html_url);
    const url = `${urlObj.origin}${path}`;
    shell.openExternal(url);
  }

  private openIssues() {
    const issue = this.props.issue;
    const {state} = GitHubUtil.getIssueTypeInfo(issue);
    const query = encodeURIComponent(`is:${issue.type} is:${state}`);
    const path = `/${issue.repo}/${issue.type === 'issue' ? 'issues' : 'pulls'}?q=${query}`;
    this.openPath(path);
  }

  private openProject(projectUrl: string) {
    shell.openExternal(projectUrl);
  }

  private openMilestone() {
    const url = this.props.issue.value.milestone.html_url;
    shell.openExternal(url);
  }

  private openLabel(label: string) {
    const path = `/${this.props.issue.repo}/labels/${label}`;
    this.openPath(path);
  }

  private openUser(loginName: string) {
    if (loginName.includes('/')) { // team name
      const tmp = loginName.split('/');
      const path = `/orgs/${tmp[0]}/teams/${tmp[1]}`;
      this.openPath(path);
    } else {
      const path = `/${loginName}`;
      this.openPath(path);
    }
  }

  private openOrg() {
    const path = `/${this.props.issue.user}`;
    this.openPath(path);
  }

  private openRepo() {
    const path = `/${this.props.issue.repo}`;
    this.openPath(path);
  }

  private openIssue() {
    shell.openExternal(this.props.issue.html_url);
  }

  private handleContextMenu(ev: React.MouseEvent, horizontalLeft: boolean) {
    if (this.props.disableMenu) return;

    // todo: だいぶ雑な実装なので適切に計算するようにしたい
    const issueRect = (ReactDOM.findDOMNode(this) as HTMLElement).getBoundingClientRect();
    if (horizontalLeft) {
      this.contextMenuHorizontalLeft = horizontalLeft;
      this.contextMenuHideBrowserView = false;
    } else {
      this.contextMenuHorizontalLeft = false;
      if (ev.clientX - issueRect.x < issueRect.width / 4) { // 左1/4をクリックしてたらブラウザを隠さなくても良い
        this.contextMenuHideBrowserView = false;
      } else {
        this.contextMenuHideBrowserView = true;
      }
    }

    const hideUnsubscribe = !this.props.onUnsubscribe;
    // const isRead = IssueRepo.isRead(this.props.issue);
    // const isBookmark = !!this.props.issue.marked_at;
    // const isArchived = !!this.props.issue.archived_at;
    this.contextMenus = [
      // {label:  isRead? 'Mark as Unread' : 'Mark as Read', icon: isRead? 'clipboard-outline' : 'clipboard-check', handler: () => this.handleToggleRead()},
      // {label:  isBookmark? 'Remove from Bookmark' : 'Add to Bookmark', icon: isBookmark? 'bookmark-outline' : 'bookmark', handler: () => this.handleToggleBookmark()},
      // {label:  isArchived? 'Remove from Archive' : 'Move to Archive', icon: isArchived? 'archive-outline' : 'archive', handler: () => this.handleToggleArchive()},
      // {type: 'separator', hide: hideUnsubscribe},
      {label: 'Unsubscribe', icon: 'volume-off', handler: () => this.handleUnsubscribe(), hide: hideUnsubscribe},
      {type: 'separator', hide: hideUnsubscribe},
      {label: 'Copy as URL', icon: 'content-copy', handler: () => this.handleCopyURL()},
      {label: 'Copy as JSON', icon: 'code-json', handler: () => this.handleCopyValue()},
      {type: 'separator'},
      {label: 'Open with Browser', subLabel: PlatformUtil.isMac() ? '(⌘ Click)' : '(Shift Click)', icon: 'open-in-new', handler: () => this.handleOpenURL()},
      {type: 'separator'},
      {label: 'Mark All Current as Read', icon: 'check', handler: () => this.handleReadCurrentAll()},
      {label: 'Mark All as Read', icon: 'check-all', handler: () => this.handleReadAll()},
    ];

    if (this.props.onCreateFilterStream) {
      this.contextMenus.push(
        {type: 'separator'},
        {label: 'Create Filter Stream', icon: 'file-tree', handler: () => this.handleCreateFilterStream()},
      );
    }

    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuIssueType(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Issue State', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleIssueType(this.props.issue)},
      {type: 'separator'},
      {label: 'Open Issues', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openIssues()},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuProject(ev: React.MouseEvent, projectName: string, projectColumn: string, projectUrl: string) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Project', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleProject(this.props.issue, projectName, projectColumn)},
      {type: 'separator'},
      {label: 'Open Project', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openProject(projectUrl)},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuMilestone(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Milestone', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleMilestone(this.props.issue)},
      {type: 'separator'},
      {label: 'Open Milestone', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openMilestone()},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuLabel(ev: React.MouseEvent, label: string) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Label', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleLabel(this.props.issue, label)},
      {type: 'separator'},
      {label: 'Open Label', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openLabel(label)},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuAuthor(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Author', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleAuthor(this.props.issue)},
      {type: 'separator'},
      {label: 'Open Author', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openUser(this.props.issue.author)},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuAssignee(ev: React.MouseEvent, loginName: string) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Assignee', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleAssignee(this.props.issue, loginName)},
      {type: 'separator'},
      {label: 'Open Assignee', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openUser(loginName)},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuReviewRequested(ev: React.MouseEvent, loginName: string) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Review Requested', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleReviewRequested(this.props.issue, loginName)},
      {type: 'separator'},
      {label: 'Open Review Requested', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openUser(loginName)},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuReview(ev: React.MouseEvent, loginName: string) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Review', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleReview(this.props.issue, loginName)},
      {type: 'separator'},
      {label: 'Open Review', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openUser(loginName)},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuOrg(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Org/User', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleRepoOrg(this.props.issue)},
      {type: 'separator'},
      {label: 'Open Org/User', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openOrg()},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuRepo(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Repository', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleRepoName(this.props.issue)},
      {type: 'separator'},
      {label: 'Open Repository', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openRepo()},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
    this.contextMenuPos = {top: ev.clientY, left: ev.clientX};
    this.setState({showMenu: true});
  }

  private handleContextMenuNumber(ev: React.MouseEvent) {
    if (this.props.disableMenu) return;

    this.contextMenus = [
      {label: 'Filter Number', subLabel: `(${PlatformUtil.select('⌥', 'Alt')} Click)`,  icon: 'filter-outline', handler: () => this.props.onToggleIssueNumber(this.props.issue)},
      {type: 'separator'},
      {label: 'Open Issue/PR', subLabel: `(${PlatformUtil.select('⌘', 'Shift')} Click)`, icon: 'open-in-new', handler: () => this.openIssue()},
    ];

    this.contextMenuHideBrowserView = true;
    this.contextMenuHorizontalLeft = false;
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

  // private handleClickIssueType(ev: React.MouseEvent) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openIssues();
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleIssueType?.(this.props.issue);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickProject(ev: React.MouseEvent, projectName: string, projectColumn: string, projectUrl: string) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openProject(projectUrl);
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleProject?.(this.props.issue, projectName, projectColumn);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickMilestone(ev: React.MouseEvent) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openMilestone();
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleMilestone?.(this.props.issue);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickLabel(ev: React.MouseEvent, label: string) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openLabel(label);
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleLabel?.(this.props.issue, label);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickAuthor(ev: React.MouseEvent) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openUser(this.props.issue.author);
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleAuthor?.(this.props.issue);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickAssignee(ev: React.MouseEvent, loginName: string) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openUser(loginName);
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleAssignee?.(this.props.issue, loginName);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickReviewRequested(ev: React.MouseEvent, loginName: string) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openUser(loginName);
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleReviewRequested?.(this.props.issue, loginName);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickReview(ev: React.MouseEvent, loginName: string) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openUser(loginName);
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleReview?.(this.props.issue, loginName);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickRepoOrg(ev: React.MouseEvent) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openOrg();
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleRepoOrg?.(this.props.issue);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickRepoName(ev: React.MouseEvent) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openRepo();
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleRepoName?.(this.props.issue);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }
  //
  // private handleClickIssueNumber(ev: React.MouseEvent) {
  //   if (this.isOpenRequest(ev)) {
  //     this.openIssue();
  //   } else if (this.isToggleRequest(ev)) {
  //     this.props.onToggleIssueNumber?.(this.props.issue);
  //   } else {
  //     this.props.onSelect(this.props.issue);
  //   }
  // }

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
        onContextMenu={(ev) => this.handleContextMenu(ev, false)}
      >
        {this.renderBody()}
        {this.renderAttributes()}
        {this.renderUsers()}
        {this.renderFooter()}
        {this.renderBookmark()}
        {this.renderActions()}

        <ContextMenu
          show={this.state.showMenu}
          onClose={() => this.setState({showMenu: false})}
          menus={this.contextMenus}
          pos={this.contextMenuPos}
          hideBrowserView={this.contextMenuHideBrowserView}
          horizontalLeft={this.contextMenuHorizontalLeft}
        />
      </Root>
    );
  }

  private renderBody() {
    const issue = this.props.issue;
    const selected = this.props.selected;
    const {icon: iconName, color: iconColor, label} = GitHubUtil.getIssueTypeInfo(issue);

    const style: CSSProperties = {};
    if (selected) style.background = iconColor;

    return (
      <Body>
        <IssueType
          // onClick={ev => this.handleClickIssueType(ev)}
          onClick={ev => this.handleContextMenuIssueType(ev)}
          onContextMenu={ev => this.handleContextMenuIssueType(ev)}
          style={style}
          title={`${label} ${issue.type === 'issue' ? 'Issue' : 'PR'} (Ctrl + Click)`}
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
        {this.renderProjects()}
        {this.renderMilestone()}
        {this.renderLabels()}
      </Attributes>
    );
  }

  private renderProjects() {
    const projects = this.props.issue.value.projects;
    if (!projects?.length) return;

    const projectViews = projects.map((project, index) => {
      const label = `${project.name}:${project.column}`
      return (
        <Project
          // onClick={(ev) => this.handleClickProject(ev, project.name, project.column, project.url)}
          onClick={ev => this.handleContextMenuProject(ev, project.name, project.column, project.url)}
          onContextMenu={ev => this.handleContextMenuProject(ev, project.name, project.column, project.url)}
          title={`${label} (Ctrl + Click)`}
          key={index}
        >
          <Icon name='rocket-launch-outline' size={iconFont.small}/>
          <ProjectText singleLine={true}>{label}</ProjectText>
        </Project>
      );
    });

    return (
      <React.Fragment>
        {projectViews}
      </React.Fragment>
    );
  }

  private renderMilestone() {
    const milestone = this.props.issue.value.milestone;
    if (!milestone) return;

    return (
      <Milestone
        // onClick={(ev) => this.handleClickMilestone(ev)}
        onClick={ev => this.handleContextMenuMilestone(ev)}
        onContextMenu={ev => this.handleContextMenuMilestone(ev)}
        title={`${milestone.title} (Ctrl + Click)`}
      >
        <Icon name='flag-variant' size={iconFont.small}/>
        <MilestoneText singleLine={true}>{milestone.title}</MilestoneText>
      </Milestone>
    );
  }

  private renderLabels() {
    const labels = this.props.issue.value.labels;
    if (!labels?.length) return;

    const labelViews = labels.map((label, index) => {
      const textColor = ColorUtil.suitTextColor(label.color);
      return (
        <Label
          // onClick={(ev) => this.handleClickLabel(ev, label.name)}
          onClick={ev => this.handleContextMenuLabel(ev, label.name)}
          onContextMenu={ev => this.handleContextMenuLabel(ev, label.name)}
          title={`${label.name} (Ctrl + Click)`}
          key={index}
          style={{background: `#${label.color}`}}
        >
          <LabelText singleLine={true} style={{color: `#${textColor}`}}>{label.name}</LabelText>
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
    const iconColor = this.props.selected ? color.white : appTheme().icon.soft;

    return (
      <Users>
        <Author
          // onClick={(ev) => this.handleClickAuthor(ev)}
          onClick={ev => this.handleContextMenuAuthor(ev)}
          onContextMenu={ev => this.handleContextMenuAuthor(ev)}
          title={`Author ${this.props.issue.author} (Ctrl + Click)`}
        >
          <Image source={{url: this.props.issue.value.user.avatar_url}}/>
        </Author>
        {this.renderAssignees()}
        <View style={{flex: 1}}/>
        {this.renderReview()}

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
        <Assignee
          // onClick={(ev) => this.handleClickAssignee(ev, assignee.login)}
          onClick={ev => this.handleContextMenuAssignee(ev, assignee.login)}
          onContextMenu={ev => this.handleContextMenuAssignee(ev, assignee.login)}
          key={index}
          title={`Assign: ${assignee.login} (Ctrl + Click)`}
        >
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

  private renderReview() {
    const author = this.props.issue.author;
    const reviews = this.props.issue.value.reviews
      ?.filter(review => review.login !== author)
      ?.sort((a, b) =>  b.state > a.state ? 1 : -1); //  'COMMENTED', 'CHANGES_REQUESTED', 'APPROVED' の順番に表示する

    const reviewRequested = this.props.issue.value.requested_reviewers;

    if (!reviewRequested?.length && !reviews?.length) return;

    const doneReviewers = reviews?.map((review, index) => {
      const className = `issue-row-review-${review.state}`;
      const iconName: IconNameType = review.state === 'APPROVED' ? 'check-bold'
        : review.state === 'CHANGES_REQUESTED' ? 'exclamation-thick' : 'plus-thick';
      return (
        <Reviewer
          // onClick={(ev) => this.handleClickReview(ev, review.login)}
          onClick={ev => this.handleContextMenuReview(ev, review.login)}
          onContextMenu={ev => this.handleContextMenuReview(ev, review.login)}
          key={index}
        >
          <UserIcon
            title={`Review: ${review.login} (Ctrl + Click)`}
            userName={review.login}
            iconUrl={review.avatar_url}
            size={icon.small2}
          />
          <ReviewStateMark className={className}>
            <Icon name={iconName} size={iconFont.nano} color={color.white}/>
          </ReviewStateMark>
        </Reviewer>
      );
    });

    const reviewLoginNames = reviews?.map(review => review.login) || [];
    const reqReviewers = reviewRequested?.filter(req => !reviewLoginNames.includes(req.login)).map((reviewRequested, index) => {
      return (
        <Reviewer
          // onClick={(ev) => this.handleClickReviewRequested(ev, reviewRequested.login)}
          onClick={ev => this.handleContextMenuReviewRequested(ev, reviewRequested.login)}
          onContextMenu={ev => this.handleContextMenuReviewRequested(ev, reviewRequested.login)}
          key={index}
          className='issue-row-review-requested'
        >
          <UserIcon
            title={`Review Requested: ${reviewRequested.login} (Ctrl + Click)`}
            userName={reviewRequested.login}
            iconUrl={reviewRequested.avatar_url}
            size={icon.small2}
          />
          <ReviewStateMark className='issue-row-review-requested'>
            <Icon name='dots-horizontal' size={iconFont.nano} color={color.white}/>
          </ReviewStateMark>
        </Reviewer>
      );
    });

    return (
      <React.Fragment>
        {reqReviewers}
        {doneReviewers}
      </React.Fragment>
    );
  }

  private renderFooter() {
    const {repoOrg, repoName} = GitHubUtil.getInfo(this.props.issue.value.url);

    const date = new Date(this.props.issue.value.updated_at);
    const updated  = DateUtil.localToString(date);
    const read = DateUtil.localToString(new Date(this.props.issue.read_at));

    let privateIcon;
    if (this.props.issue.repo_private) {
      const iconColor = this.props.selected ? color.white : appTheme().icon.soft;
      privateIcon = (
        <PrivateIconWrap>
          <Icon name='lock-outline' size={iconFont.tiny} color={iconColor}/>
        </PrivateIconWrap>
      );
    }

    return (
      <Footer>
        {privateIcon}
        <RepoName>
          <ClickView onClick={(ev) => this.handleContextMenuOrg(ev)} onContextMenu={ev => this.handleContextMenuOrg(ev)} title={`${repoOrg} (Ctrl + Click)`}>
            <RepoNameText singleLine={true}>{repoOrg}</RepoNameText>
          </ClickView>
          <ClickView onClick={(ev) => this.handleContextMenuRepo(ev)} onContextMenu={ev => this.handleContextMenuRepo(ev)} title={`${repoName} (Ctrl + Click)`}>
            <RepoNameText singleLine={true}>/{repoName}</RepoNameText>
          </ClickView>
          <Number onClick={(ev) => this.handleContextMenuNumber(ev)} onContextMenu={ev => this.handleContextMenuNumber(ev)} title={`#${this.props.issue.number} (Ctrl + Click)`}>
            <NumberText>#{this.props.issue.value.number}</NumberText>
          </Number>
        </RepoName>

        <View style={{flex: 1}}/>

        <UpdatedAt title={`Updated at ${updated}\n      Read at ${read}`}>
          <UpdatedAtText singleLine={true}>{DateUtil.fromNow(date)}</UpdatedAtText>
        </UpdatedAt>
      </Footer>
    );
  }

  private renderBookmark() {
    if (!this.props.issue.marked_at) return null;

    return (
      <BookmarkWrap
        onClick={() => this.handleToggleBookmark()}
        title='Remove from Bookmark'
        name='bookmark'
        color={this.props.selected ? color.white : appTheme().accent.normal}
      />
    );
  }

  private renderActions() {
    if (this.props.disableMenu) return;

    const readIconName: IconNameType = IssueRepo.isRead(this.props.issue) ? 'clipboard-check' : 'clipboard-outline';
    const markIconName: IconNameType = this.props.issue.marked_at ? 'bookmark' : 'bookmark-outline';
    const archiveIconName: IconNameType = this.props.issue.archived_at ? 'archive' : 'archive-outline';

    return (
      <Actions>
        <Action
          onClick={() => this.handleToggleRead()}
          name={readIconName}
          title={`${IssueRepo.isRead(this.props.issue) ? 'Mark as Unread' : 'Mark as Read'}`}
          color={appTheme().icon.soft}
          size={iconFont.small}
        />

        <Action
          onClick={() => this.handleToggleBookmark()}
          name={markIconName}
          title={`${this.props.issue.marked_at ? 'Remove from Bookmark' : 'Add to Bookmark'}`}
          color={appTheme().icon.soft}
          size={iconFont.small}
        />

        <Action
          onClick={() => this.handleToggleArchive()}
          name={archiveIconName}
          title={`${this.props.issue.archived_at ? 'Remove from Archive' : 'Move to Archive'}`}
          color={appTheme().icon.soft}
          size={iconFont.small}
        />

        <Action
          onClick={(ev) => this.handleContextMenu(ev, true)}
          name='dots-vertical'
          color={appTheme().icon.soft}
          size={iconFont.small}
          style={{marginLeft: 0}}
        />
      </Actions>
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
  position: relative;
  border-bottom: solid ${border.medium}px ${() => appTheme().border.normal};
  padding: ${space.medium}px;

  &.issue-unread {
    background: ${() => appTheme().issue.unread};
  }

  &.issue-read {
    background: ${() => appTheme().issue.read};
  }

  &.issue-selected {
    background: ${() => appTheme().accent.normal};
  }

  &.issue-unselected {
  }

  &.issue-fadein {
    animation: ${fadein} 1s;
  }
`;

const PrivateIconWrap = styled(View)`
  padding-bottom: ${space.tiny}px;
  padding-right: ${space.tiny}px;
  align-self: flex-end;
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
  min-height: 60px;
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
    color: ${() => appTheme().text.soft};
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

  .issue-slim & {
    display: none;
  }
`;

const Project = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  background: ${() => appTheme().bg.primary};
  border: solid ${border.medium}px ${() => appTheme().border.bold};
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

const ProjectText = styled(Text)`
  font-size: ${font.small}px;
  font-weight: ${fontWeight.softBold};
  padding-left: ${space.tiny}px;
  max-width: 100px;
`;

const Milestone = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  background: ${() => appTheme().bg.primary};
  border: solid ${border.medium}px ${() => appTheme().border.bold};
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
  font-weight: ${fontWeight.softBold};
  max-width: 100px;
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
  font-weight: ${fontWeight.softBold};
  max-width: 100px;
`;

// users
const Users = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-top: ${space.medium}px;
  overflow: visible;
  flex-wrap: wrap;
  
  .issue-slim & {
    display: none;
  }
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

const Reviewer = styled(ClickView)`
  position: relative;
  margin-right: ${space.small2}px;
  
  /* review state markを表示するため */
  overflow: visible;

  &:hover {
    opacity: 0.7;
  }
`;

const ReviewStateMark = styled(View)`
  position: absolute;
  bottom: -4px;
  right: -6px;
  border: solid ${border.large}px ${() => appTheme().bg.primary};
  border-radius: 100px;
  
  &.issue-row-review-requested {
    background: ${color.issue.review.reviewRequested};
  }
  
  &.issue-row-review-APPROVED {
    background: ${color.issue.review.approved};
  }
  
  &.issue-row-review-COMMENTED {
    background: ${color.issue.review.commented};
  }
  
  &.issue-row-review-CHANGES_REQUESTED {
    background: ${color.issue.review.changesRequested};
  }
`;

// footer
const Footer = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-top: ${space.medium}px;
  
  .issue-slim & {
    padding-top: 0;
  }
`;

const RepoName = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const RepoNameText = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().text.tiny};

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
  color: ${() => appTheme().text.tiny};

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
  color: ${() => appTheme().text.tiny};
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
  color: ${() => appTheme().text.tiny};

  .issue-read & {
    font-weight: ${fontWeight.thin};
  }

  .issue-selected & {
    color: ${color.white};
  }
`;

const BookmarkWrap = styled(IconButton)`
  position: absolute;
  top: -8px;
  right: 0;
  padding: ${space.small}px;
`;

const Actions = styled(View)`
  display: none;
  position: absolute;
  bottom: ${space.small}px;
  right: ${space.small}px;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  background: ${() => appTheme().bg.primary};
  border-radius: 6px;
  padding: 1px ${space.tiny}px;
  flex-direction: row;
  align-items: center;
  box-shadow: 0 0 4px 1px #00000008;

  .issue-row:hover & {
    display: flex;
  }
`;

const Action = styled(IconButton)`
  padding: ${space.small}px ${space.small}px;
  margin: 0 ${space.tiny}px;
`;
