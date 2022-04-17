import React, {useState} from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {border, fontWeight, space} from '../../Library/Style/layout';
import {StreamSetupRepoFragment} from './StreamSetupRepoFragment';
import {RemoteIssueEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {ProjectProp} from './StreamSetupCommon';
import {StreamSetupTeamFragment} from './StreamSetupTeamFragment';
import {StreamSetupProjectFragment} from './StreamSetupProjectFragment';
import {StreamSetupCreateFragment} from './StreamSetupCreateFragment';
import {Icon} from '../../Library/View/Icon';
import {color} from '../../Library/Style/color';
import {StreamSetupLoadingFragment} from './StreamSetupLoadingFragment';

export const StreamSetupFragment: React.FC = () => {
  const [isShow, setIsShow] = useState(true);
  const [activeSide, setActiveSide] = useState<'repo' | 'team' | 'project' | 'create' | null>(null);
  const [recentlyIssues, setRecentlyIssues] = useState<RemoteIssueEntity[]>([]);
  const [watchingRepos, setWatchingRepos] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectProp[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedProjects, setSelectedProject] = useState<ProjectProp[]>([]);

  function onFinishLoading(recentlyIssues: RemoteIssueEntity[], watchingRepos: string[], teams: string[], projects: ProjectProp[]) {
    setRecentlyIssues(recentlyIssues);
    setWatchingRepos(watchingRepos);
    setTeams(teams);
    setProjects(projects);
    setActiveSide('repo');
  }

  function onFinishRepo(repos: string[]) {
    setSelectedRepos(repos);
    setActiveSide('team');
  }

  function onFinishTeam(teams: string[]) {
    setSelectedTeams(teams);
    setActiveSide('project');
  }

  function onFinishProject(projects: ProjectProp[]) {
    setSelectedProject(projects);
    setActiveSide('create');
  }

  function onFinishConfirm() {
    setIsShow(false);
  }

  return (
    <Modal show={isShow} onClose={() => null} style={{padding: 0}} draggable={false}>
      <Root>
        <Side>
          <SideRow className={activeSide === 'repo' ? 'active' : null}><Icon name='menu-right'/> リポジトリ</SideRow>
          <SideRow className={activeSide === 'team' ? 'active' : null} ><Icon name='menu-right'/> チーム</SideRow>
          <SideRow className={activeSide === 'project' ? 'active' : null}><Icon name='menu-right'/> プロジェクト</SideRow>
          <SideRow className={activeSide === 'create' ? 'active' : null}><Icon name='menu-right'/> 作成</SideRow>
        </Side>

        <StreamSetupLoadingFragment
          show={activeSide == null}
          onFinish={onFinishLoading}
        />
        <StreamSetupRepoFragment
          show={activeSide === 'repo'}
          recentlyIssues={recentlyIssues}
          watchingRepos={watchingRepos}
          onFinish={onFinishRepo}
        />
        <StreamSetupTeamFragment
          show={activeSide === 'team'}
          teams={teams}
          onFinish={onFinishTeam}
          onBack={() => setActiveSide('repo')}
        />
        <StreamSetupProjectFragment
          show={activeSide === 'project'}
          projects={projects}
          onFinish={onFinishProject}
          onBack={() => setActiveSide('team')}
        />
        <StreamSetupCreateFragment
          show={activeSide === 'create'}
          repos={selectedRepos}
          teams={selectedTeams}
          projects={selectedProjects}
          onFinish={onFinishConfirm}
          onBack={() => setActiveSide('project')}
        />
      </Root>
    </Modal>
  );
}

const Root = styled(View)`
  background-color: ${() => appTheme().bg.primary};
  width: 800px;
  height: 600px;
  flex-direction: row;
`;

// side
const Side = styled(View)`
  background-color: ${() => appTheme().bg.secondary};
  width: 200px;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  padding-top: ${space.medium}px;
`;

const SideRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding: ${space.medium}px;

  &.active, &.active * {
    background-color: ${() => appTheme().accent.normal};
    color: ${color.white};
    font-weight: ${fontWeight.bold};
  }
`;
