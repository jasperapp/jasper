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
import {space} from '../../Library/Style/layout';
import styled from 'styled-components';
import {Translate} from '../../Library/View/Translate';

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

  async function createStreams() {
    setIsLoading(true);
    await createRepoStreams(props.repos);
    await createOrgStreams(props.orgs);
    await createTeamStreams(props.teams);
    await StreamPolling.restart();
    await TimerUtil.sleep(1000);
    props.onFinish();
  }

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc onMessage={mc => mc.streamSetup.create.desc}/>

      {props.repos.length > 0 && (
        <>
          <StreamSetupSectionLabel onMessage={mc => mc.streamSetup.create.repo}/>
          <StyledTextInput onChange={() => null} value={repoQuery} readOnly={true}/>
          <Space/>
        </>
      )}

      {props.orgs.length > 0 && (
        <>
          <StreamSetupSectionLabel onMessage={mc => mc.streamSetup.create.org}/>
          <StyledTextInput onChange={() => null} value={orgQuery} readOnly={true}/>
          <Space/>
        </>
      )}

      {props.teams.length > 0 && (
        <>
          <StreamSetupSectionLabel onMessage={mc => mc.streamSetup.create.team}/>
          <StyledTextInput onChange={() => null} value={teamMentionQuery} readOnly={true}/>
          <StyledTextInput onChange={() => null} value={teamReviewRequestedQuery} readOnly={true}/>
          <Space/>
        </>
      )}

      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}><Translate onMessage={mc => mc.streamSetup.button.back}/></Button>
        <View style={{flex: 1}}/>
        <Loading show={isLoading}/>
        <View style={{flex: 1}}/>
        <Button onClick={() => createStreams()} type='primary'><Translate onMessage={mc => mc.streamSetup.button.create}/></Button>
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

const StyledTextInput = styled(TextInput)`
  margin-bottom: ${space.medium}px;
`;

const Space = styled(View)`
  height: ${space.large}px;
`;
