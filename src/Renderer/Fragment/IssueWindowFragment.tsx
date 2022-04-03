import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {View} from '../Library/View/View';
import {PlatformUtil} from '../Library/Util/PlatformUtil';
import {border} from '../Library/Style/layout';
import {appTheme} from '../Library/Style/appTheme';
import {BrowserFragment} from './Browser/BrowserFragment';
import {IssueRepo} from '../Repository/IssueRepo';
import {IssueEvent} from '../Event/IssueEvent';
import {UserPrefRepo} from '../Repository/UserPrefRepo';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {GlobalStyle} from './MainWindowFragment';

type Props = {}
type State = {
  isDoneUserPrefRepoInit: boolean;
}

class IssueWindowFragment extends React.Component<Props, State> {
  state: State = {isDoneUserPrefRepoInit: false};

  async componentDidMount() {
    await UserPrefRepo.init(false);
    this.setState({isDoneUserPrefRepoInit: true});

    const urlObj = new URL(window.location.href);
    const url = urlObj.searchParams.get('url');
    if (url == null) return;

    const {repo, issueNumber} = GitHubUtil.getInfo(url);
    const {error, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
    if (error != null) return;
    IssueEvent.emitSelectIssue(issue, issue.read_body);
  }

  render() {
    if (!this.state.isDoneUserPrefRepoInit) {
      return <Root/>;
    }

    return (
      <Root>
        <BrowserFragment firstLoading={false}/>
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
