import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {View} from '../Library/View/View';
import {PlatformUtil} from '../Library/Util/PlatformUtil';
import {border} from '../Library/Style/layout';
import {appTheme} from '../Library/Style/appTheme';
import {BrowserFragment} from './Browser/BrowserFragment';
import {UserPrefRepo} from '../Repository/UserPrefRepo';
import {GlobalStyle} from './MainWindowFragment';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {IssueRepo} from '../Repository/IssueRepo';
import {IssueEvent} from '../Event/IssueEvent';

type Props = {}
type State = {}

class IssueWindowFragment extends React.Component<Props, State> {
  componentDidMount() {
    BrowserViewIPC.onEventOpenIssueWindow((url) => this.loadIssue(url));
    UserPrefRepo.init(false);
  }

  private async loadIssue(url: string) {
    const {repo, issueNumber} = GitHubUtil.getInfo(url);
    const {error, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
    if (error != null) return;
    IssueEvent.emitSelectIssue(issue, issue.read_body);
  }

  render() {
    return (
      <Root>
        <BrowserFragment firstLoading={false} isHideHelp={true}/>
        <GlobalStyle/>
      </Root>
    );
  }
}

const Root = styled(View)`
  width: 100vw;
  height: 100vh;
  border-top: solid ${PlatformUtil.isMac() ? 0 : border.medium}px ${() => appTheme().border.normal};
`;

export function mountFragment() {
  ReactDOM.render(
    <IssueWindowFragment/>,
    document.querySelector('#root')
  );
}
