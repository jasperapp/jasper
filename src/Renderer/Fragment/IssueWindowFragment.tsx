import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {BrowserViewIPCChannels} from '../../IPC/BrowserViewIPC/BrowserViewIPC.channel';
import {IssueEvent} from '../Event/IssueEvent';
import {appTheme} from '../Library/Style/appTheme';
import {border} from '../Library/Style/layout';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {PlatformUtil} from '../Library/Util/PlatformUtil';
import {View} from '../Library/View/View';
import {IssueRepo} from '../Repository/IssueRepo';
import {UserPrefRepo} from '../Repository/UserPrefRepo';
import {BrowserFragment} from './Browser/BrowserFragment';
import {GlobalStyle} from './MainWindowFragment';

type Props = {}
type State = {}

class IssueWindowFragment extends React.Component<Props, State> {
  componentDidMount() {
    window.ipc.on(BrowserViewIPCChannels.eventOpenIssueWindow, (_ev, url) => this.loadIssue(url));
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

// export function mountFragment() {
//   ReactDOM.render(
//     <IssueWindowFragment/>,
//     document.querySelector('#root')
//   );
// }

window.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(<IssueWindowFragment/>, document.querySelector('#root'));
});
