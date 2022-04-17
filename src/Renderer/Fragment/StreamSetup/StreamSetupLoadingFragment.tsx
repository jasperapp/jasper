import React, {useEffect, useState} from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupDesc, StreamSetupFooter} from './StreamSetupCommon';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {GitHubUserClient} from '../../Library/GitHub/GitHubUserClient';
import {RemoteIssueEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {GitHubV4IssueClient} from '../../Library/GitHub/V4/GitHubV4IssueClient';
import {GitHubSearchClient} from '../../Library/GitHub/GitHubSearchClient';
import {Loading} from '../../Library/View/Loading';

type Props = {
  show: boolean;
  onFinish: (recentlyIssues: RemoteIssueEntity[], watchingRepos: string[], teams: string[], projects: ProjectProp[]) => void;
};

export const StreamSetupLoadingFragment: React.FC<Props> = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [recentlyIssues, setRecentlyIssues] = useState<RemoteIssueEntity[]>([]);
  const [watchingRepos, setWatchingRepos] = useState<string[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectProp[]>([]);

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
  }

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>
        JasperでIssueやプルリクエストを閲覧するためにストリームを作成する必要があります。
        このウィザードではGitHubでの活動にもとづいたストリームを作成していきます。
        必要なデータの収集が終わったら、次に進んでください。
      </StreamSetupDesc>
      <Loading show={isLoading}/>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <View style={{flex: 1}}/>
        <Button
          onClick={() => props.onFinish(recentlyIssues, watchingRepos, teams, projects)}
          disable={isLoading}
          type='primary'
        >
          次へ
        </Button>
      </StreamSetupFooter>
    </StreamSetupBody>
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
