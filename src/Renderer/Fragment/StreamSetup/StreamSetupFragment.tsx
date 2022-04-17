import React, {useEffect, useState} from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {border, space} from '../../Library/Style/layout';
import {ClickView} from '../../Library/View/ClickView';
import {StreamSetupRepoFragment} from './StreamSetupRepoFragment';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {GitHubSearchClient} from '../../Library/GitHub/GitHubSearchClient';
import {RemoteIssueEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {GitHubUserClient} from '../../Library/GitHub/GitHubUserClient';
import {Loading} from '../../Library/View/Loading';
import {ProjectProp, StreamSetupBody} from './StreamSetupCommon';
import {StreamSetupTeamFragment} from './StreamSetupTeamFragment';
import {GitHubV4IssueClient} from '../../Library/GitHub/V4/GitHubV4IssueClient';
import {StreamSetupProjectFragment} from './StreamSetupProjectFragment';
import {StreamSetupConfirmFragment} from './StreamSetupConfirmFragment';

export const StreamSetupFragment: React.FC = () => {
  const [isShow, setIsShow] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSide, setActiveSide] = useState<'repo' | 'team' | 'project' | 'confirm' | null>(null);
  const [recentlyIssues, setRecentlyIssues] = useState<RemoteIssueEntity[]>([]);
  const [watchingRepos, setWatchingRepos] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectProp[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedProjects, setSelectedProject] = useState<ProjectProp[]>([]);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const {error: e1, issues} = await fetchRecentlyIssues();
    if (e1) return console.error(e1);
    setRecentlyIssues(issues);

    const {error: e2, watchings} = await fetchWatchingRepos();
    if (e2) return console.error(e2);
    setWatchingRepos(watchings);

    const {error: e3, teams} = await fetchTeams();
    if (e3) return console.error(e3);
    setTeams(teams);

    const {error: e4, projects} = await fetchProjects(issues);
    if (e4) return console.error(e4);
    setProjects(projects);

    setIsLoading(false);
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
    setActiveSide('confirm');
  }

  function onFinishConfirm() {
    setIsShow(false);
  }

  return (
    <Modal show={isShow} onClose={() => null} style={{padding: 0}} draggable={false}>
      <Root>
        <Side>
          <SideRow onClick={() => setActiveSide('repo')}>Repository</SideRow>
          <SideRow onClick={() => setActiveSide('team')}>Team</SideRow>
          <SideRow onClick={() => setActiveSide('project')}>Project</SideRow>
        </Side>

        {
          isLoading && (<StreamSetupBody><Loading show={true}/></StreamSetupBody>)
        }
        <StreamSetupRepoFragment show={activeSide === 'repo'} recentlyIssues={recentlyIssues} watchingRepos={watchingRepos} onFinish={onFinishRepo}/>
        <StreamSetupTeamFragment show={activeSide === 'team'} teams={teams} onFinish={onFinishTeam}/>
        <StreamSetupProjectFragment show={activeSide === 'project'} projects={projects} onFinish={onFinishProject}/>
        <StreamSetupConfirmFragment show={activeSide === 'confirm'} repos={selectedRepos} teams={selectedTeams} projects={selectedProjects} onFinish={onFinishConfirm}/>
      </Root>
    </Modal>
  );
}

async function fetchRecentlyIssues(): Promise<{error?: Error; issues?: RemoteIssueEntity[]}> {
  const github = UserPrefRepo.getPref().github;
  const client = new GitHubSearchClient(github.accessToken, github.host, github.pathPrefix, github.https);
  const query = `involves:${UserPrefRepo.getUser().login}`;
  const {error, issues} = await client.search(query, 1, 100);
  if (error) {
    return {error};
  }
  return {issues};
}

async function fetchWatchingRepos(): Promise<{error?: Error; watchings?: string[]}> {
  const github = UserPrefRepo.getPref().github;
  const client = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
  const {error, watchings} = await client.getUserWatchings();
  if (error) return {error};

  return {watchings: watchings.map(w => w.full_name).reverse()}
}

async function fetchTeams(): Promise<{error?: Error; teams?: string[]}> {
  const github = UserPrefRepo.getPref().github;
  const client = new GitHubUserClient(github.accessToken, github.host, github.pathPrefix, github.https);
  const {error, teams: remoteTeams} = await client.getUserTeams();
  if (error) return {error};

  const teams = remoteTeams.map(remoteTeam => {
    const org = remoteTeam.organization.login;
    const name = remoteTeam.slug;
    return `${org}/${name}`;
  });

  return {teams}
}

async function fetchProjects(remoteIssues: RemoteIssueEntity[]): Promise<{error?: Error; projects?: ProjectProp[]}> {
  const github = UserPrefRepo.getPref().github;
  const client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
  const {error, issues} = await client.getIssuesByNodeIds(remoteIssues);
  if (error) return {error};

  const projectMap: {[url: string]: {url: string; title: string;}} = {};
  issues.forEach(issue => {
    issue.projectCards?.nodes?.forEach(projectCard => {
      projectMap[projectCard.project.url] = {url: projectCard.project.url, title: projectCard.project.name};
    });

    issue.projectNextItems?.nodes?.forEach(projectNextItem => {
      projectNextItem.fieldValues?.nodes?.forEach(fieldValue => {
        projectMap[fieldValue.projectField.project.url] = {url: fieldValue.projectField.project.url, title: fieldValue.projectField.project.title};
      });
    });
  });

  const projects = Object.values(projectMap);
  return {projects};
}

const Root = styled(View)`
  background-color: ${() => appTheme().bg.primary};
  width: 980px;
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

const SideRow = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  padding: ${space.medium}px;

  &.active {
    background-color: ${() => appTheme().bg.primaryHover};
  }
`;
