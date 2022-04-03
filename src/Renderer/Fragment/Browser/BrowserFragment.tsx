import React from 'react';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {BrowserLoadFragment} from './BrowserLoadFragment';
import {BrowserSearchFragment} from './BrowserSearchFragment';
import {BrowserCodeExecFragment} from './BrowserCodeExecFragment';
import {BrowserFrameFragment} from './BrowserFrameFragment';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {GitHubUtil} from '../../Library/Util/GitHubUtil';
import {IssueRepo} from '../../Repository/IssueRepo';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IssueEvent} from '../../Event/IssueEvent';

type Props = {
  className?: string;
  firstLoading?: boolean;
  isHideHelp?: boolean;
}

type State = {
  toolbarMode: 'load' | 'search',
}

export class BrowserFragment extends React.Component<Props, State> {
  static defaultProps = {className: ''};

  state: State = {
    toolbarMode: 'load',
  };

  componentDidMount() {
    BrowserViewIPC.onEventOpenIssueWindow((url) => this.handleOpenIssueWindow(url));
    BrowserViewIPC.onStartSearch(() => this.handleSearchStart());
    this.setupConsoleLog();
  }

  private setupConsoleLog() {
    BrowserViewIPC.onEventConsoleMessage((level, message) => {
      const log = `[BrowserView] ${message}`;
      switch (level) {
        case -1: console.debug(log); break;
        case 0: console.log(log); break;
        case 1: console.warn(log); break;
        case 2: console.error(log); break;
      }
    });
  }

  private async handleOpenIssueWindow(url: string) {
    const host = UserPrefRepo.getPref().github.webHost;
    if (GitHubUtil.isIssueUrl(host, url)) {
      // get issue
      const {repo, issueNumber} = GitHubUtil.getInfo(url);
      const {error: e1, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
      if (e1 != null) return console.error(e1);

      // update issue
      const {error: e2, issue: updatedIssue} = await IssueRepo.updateRead(issue.id, new Date());
      if (e2 != null) return console.error(e2);

      IssueEvent.emitUpdateIssues([updatedIssue], [issue], 'read');
    }
  }

  private handleSearchStart() {
    this.setState({toolbarMode: 'search'});
  }

  render() {
    return (
      <Root className={this.props.className}>
        <BrowserLoadFragment
          show={this.state.toolbarMode === 'load'}
          onSearchStart={() => this.handleSearchStart()}
          firstLoading={this.props.firstLoading}
        />

        <BrowserSearchFragment
          show={this.state.toolbarMode === 'search'}
          onClose={() => this.setState({toolbarMode: 'load'})}
        />

        <BrowserFrameFragment isHideHelp={this.props.isHideHelp}/>

        <BrowserCodeExecFragment/>
      </Root>
    );
  }
}

const Root = styled(View)`
  flex: 1;
  height: 100%;
  background: ${() => appTheme().bg.primary};
`;
