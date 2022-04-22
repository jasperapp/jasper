import React, {useState} from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupDesc, StreamSetupFooter, StreamSetupSectionLabel} from './StreamSetupCommon';
import {TextInput} from '../../Library/View/TextInput';
import {Button} from '../../Library/View/Button';
import {color} from '../../Library/Style/color';
import {StreamRepo} from '../../Repository/StreamRepo';
import {Loading} from '../../Library/View/Loading';
import {View} from '../../Library/View/View';
import {StreamPolling} from '../../Repository/Polling/StreamPolling';
import {TimerUtil} from '../../Library/Util/TimerUtil';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {GitHubV4ProjectNextClient} from '../../Library/GitHub/V4/GitHubV4ProjectNextClient';
import {space} from '../../Library/Style/layout';
import styled from 'styled-components';

type Props = {
  show: boolean;
  repos: string[];
  orgs: string[];
  teams: string[];
  projects: ProjectProp[];
  onFinish: () => void;
  onBack: () => void;
}

export const StreamSetupCreateFragment: React.FC<Props> = (props) => {
  const [isLoading, setIsLoading] = useState(false);
  const repoQuery = props.repos.map(repo => `repo:${repo}`).join(' ');
  const orgQuery = props.orgs.map(org => `org:${org}`).join(' ');
  const teamMentionQuery = props.teams.map(team => `team:${team}`).join(' ');
  const teamReviewRequestedQuery = props.teams.map(team => `team-review-requested:${team}`).join(' ');
  const projectQueries = props.projects.map(project => project.url);

  const projectQueryViews = projectQueries.map(projectUrl => {
    return <StyledTextInput key={projectUrl} onChange={() => null} value={projectUrl} readOnly={true}/>;
  });

  async function createStreams() {
    setIsLoading(true);
    await createRepoStreams(props.repos);
    await createOrgStreams(props.orgs);
    await createTeamStreams(props.teams);
    await createProjectStreams(props.projects);
    await StreamPolling.restart();
    await TimerUtil.sleep(1000);
    props.onFinish();
  }

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>選択された内容にもとづいてストリームを作成します。ストリームの内容は後から変更できます。</StreamSetupDesc>

      {props.repos.length > 0 && (
        <>
          <StreamSetupSectionLabel>リポジトリに関連するストリーム</StreamSetupSectionLabel>
          <StyledTextInput onChange={() => null} value={repoQuery} readOnly={true}/>
          <Space/>
        </>
      )}

      {props.orgs.length > 0 && (
        <>
          <StreamSetupSectionLabel>Organizationに関連するストリーム</StreamSetupSectionLabel>
          <StyledTextInput onChange={() => null} value={orgQuery} readOnly={true}/>
          <Space/>
        </>
      )}

      {props.teams.length > 0 && (
        <>
          <StreamSetupSectionLabel>チームに関連するストリーム</StreamSetupSectionLabel>
          <StyledTextInput onChange={() => null} value={teamMentionQuery} readOnly={true}/>
          <StyledTextInput onChange={() => null} value={teamReviewRequestedQuery} readOnly={true}/>
          <Space/>
        </>
      )}

      {props.projects.length > 0 && (
        <>
          <StreamSetupSectionLabel>プロジェクトに関連するストリーム</StreamSetupSectionLabel>
          {projectQueryViews}
          <Space/>
        </>
      )}

      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}>戻る</Button>
        <View style={{flex: 1}}/>
        <Loading show={isLoading}/>
        <View style={{flex: 1}}/>
        <Button onClick={() => createStreams()} type='primary'>ストリームを作成</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}

async function createRepoStreams(repos: string[]) {
  if (repos.length === 0) return;

  // create stream
  const iconColor = color.stream.green;
  const query = repos.map(repo => `repo:${repo}`).join(' ');
  const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Repo', [query], [], 1, iconColor);
  if (error) {
    console.error(error);
    return;
  }

  // create filter
  for (const repo of repos) {
    await StreamRepo.createStream('FilterStream', stream.id, repo, [], [`repo:${repo}`], 1, iconColor);
  }
}

async function createOrgStreams(orgs: string[]) {
  if (orgs.length === 0) return;

  // create stream
  const iconColor = color.stream.green;
  const query = orgs.map(repo => `org:${repo}`).join(' ');
  const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Org', [query], [], 1, iconColor);
  if (error) {
    console.error(error);
    return;
  }

  // create filter
  for (const org of orgs) {
    await StreamRepo.createStream('FilterStream', stream.id, org, [], [`org:${org}`], 1, iconColor);
  }
}

async function createTeamStreams(teams: string[]) {
  if (teams.length === 0) return;

  // create stream
  const iconColor = color.stream.navy;
  const teamMentionQuery = teams.map(team => `team:${team}`).join(' ');
  const teamReviewRequestedQuery = teams.map(team => `team-review-requested:${team}`).join(' ');
  const {error, stream} = await StreamRepo.createStream('UserStream', null, 'Team', [teamMentionQuery, teamReviewRequestedQuery], [], 1, iconColor);
  if (error) {
    console.error(error);
    return;
  }

  // create filter
  for (const team of teams) {
    await StreamRepo.createStream('FilterStream', stream.id, `@${team}`, [], [`team:${team}`, `review-requested:${team}`], 1, iconColor);
  }
}

async function createProjectStreams(projects: ProjectProp[]) {
  if (projects.length === 0) return;

  const iconColor = color.stream.orange;
  const github = UserPrefRepo.getPref().github;
  const gheVersion = UserPrefRepo.getGHEVersion();
  const client = new GitHubV4ProjectNextClient(github.accessToken, github.host, github.https, gheVersion);
  for (const project of projects) {
    // create stream
    const {error, stream} = await StreamRepo.createStream('ProjectStream', null, project.title, [project.url], [], 1, iconColor);
    if (error) return console.error(error);

    // fetch project fields
    const {error: e1, iterationName, statusNames} = await client.getProjectStatusFieldNames(project.url);
    if (e1 != null) {
      console.error(e1);
      return;
    }

    // create iteration filter
    if (iterationName != null) {
      const {error} = await StreamRepo.createStream('FilterStream', stream.id, `Current ${iterationName}`, [], [`project-field:"${iterationName}/@current_iteration"`], 1, iconColor);
      if (error != null) {
        console.error(error);
        return;
      }
    }

    // create status filter
    for (const statusName of statusNames) {
      const {error} = await StreamRepo.createStream('FilterStream', stream.id, statusName, [], [`project-field:"status/${statusName}"`], 1, iconColor);
      if (error != null) {
        console.error(error);
        return;
      }
    }
  }
}

const StyledTextInput = styled(TextInput)`
  margin-bottom: ${space.medium}px;
`;

const Space = styled(View)`
  height: ${space.large}px;
`;
