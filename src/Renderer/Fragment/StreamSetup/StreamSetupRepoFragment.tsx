import React, {useMemo, useState} from 'react';
import {StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter} from './StreamSetupCommon';
import {RemoteIssueEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {fontWeight, space} from '../../Library/Style/layout';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {ArrayUtil} from '../../Library/Util/ArrayUtil';
import styled from 'styled-components';
import {Text} from '../../Library/View/Text';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

type Props = {
  show: boolean;
  recentlyIssues: RemoteIssueEntity[];
  watchingRepos: string[];
  onFinish: (repos: string[], orgs: string[]) => void;
};

export const StreamSetupRepoFragment: React.FC<Props> = (props) => {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const recentlyRepos = useMemo(() => getRepositories(props.recentlyIssues), [props.recentlyIssues]);
  const repos = ArrayUtil.unique<string>([...recentlyRepos, ...props.watchingRepos]);
  const orgs = getOrgs(repos);

  const filteredOrgs = orgs.filter(org =>  org.toLowerCase().includes(filter)).sort();
  const filteredRecentlyRepos = recentlyRepos.filter(repo => repo.toLowerCase().includes(filter)).sort();
  const filteredWatchingRepos = props.watchingRepos.filter(repo => repo.toLowerCase().includes(filter)).sort();

  function toggleSelectedRepo(repo: string) {
    if (selectedRepos.includes(repo)) {
      setSelectedRepos(selectedRepos.filter(v => v !== repo));
    } else {
      setSelectedRepos([...selectedRepos, repo]);
    }
  }

  function toggleSelectedOrg(org: string) {
    if (selectedOrgs.includes(org)) {
      setSelectedOrgs(selectedOrgs.filter(v => v !== org));
    } else {
      setSelectedOrgs([...selectedOrgs, org]);
    }
  }

  function onChangeFilter(filter: string) {
    setFilter(filter.toLowerCase());
  }

  function onFinish() {
    props.onFinish(selectedRepos, selectedOrgs);
  }

  const orgViews = filteredOrgs.map(org => {
    const checked = selectedOrgs.includes(org);
    return <StreamSetupCheckBox key={org} checked={checked} onChange={() => toggleSelectedOrg(org)} label={org}/>
  });

  const recentlyRepoViews = filteredRecentlyRepos.map(repo => {
    const checked = selectedRepos.includes(repo);
    return <StreamSetupCheckBox key={repo} checked={checked} onChange={() => toggleSelectedRepo(repo)} label={repo}/>
  });

  const watchingRepoViews = filteredWatchingRepos.map(repo => {
    const checked = selectedRepos.includes(repo);
    return <StreamSetupCheckBox key={repo} checked={checked} onChange={() => toggleSelectedRepo(repo)} label={repo}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>Jasperで閲覧したいリポジトリやOrganizationを選択してください。この内容は後から変更できます。</StreamSetupDesc>
      <TextInput
        onChange={onChangeFilter}
        value={filter}
        style={{marginBottom: space.medium}}
        placeholder='リポジトリをフィルターする'
      />
      <ScrollView>
        {orgViews.length > 0 && (
          <>
            <Label>最近活動したOrganization</Label>
            {orgViews}
            <View style={{height: space.large}}/>
          </>
        )}

        {recentlyRepoViews.length > 0 && (
          <>
            <Label>最近活動したリポジトリ</Label>
            {recentlyRepoViews}
            <View style={{height: space.large}}/>
          </>
        )}

        {watchingRepoViews.length > 0 && (
          <>
            <Label>ウォッチしているリポジトリ（一部）</Label>
            {watchingRepoViews}
            <View style={{height: space.large}}/>
          </>
        )}

        {orgViews.length === 0 && recentlyRepoViews.length === 0 && watchingRepoViews.length === 0 && (
          <StreamSetupEmpty>関連するリポジトリやOrganizationは見つかりませんでした</StreamSetupEmpty>
        )}
      </ScrollView>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <View style={{flex: 1}}/>
        <Button onClick={onFinish} type='primary'>次へ</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}

function getRepositories(issues: RemoteIssueEntity[]): string[] {
  if (!issues.length) return [];

  const repoCounts = {};
  for (const issue of issues) {
    const paths = issue.url.split('/').reverse();
    const repo = `${paths[3]}/${paths[2]}`;
    if (!repoCounts[repo]) repoCounts[repo] = 0;
    repoCounts[repo]++;
  }

  const items = Object.keys(repoCounts).map(repo => ({repo: repo, count: repoCounts[repo]}));
  items.sort((a, b) => b.count - a.count);
  return items.map(item => item.repo);
}

function getOrgs(repos: string[]): string[] {
  if (repos.length === 0) return [];

  const orgCounts: Record<string, number> = {};
  for (const repo of repos) {
    const org = repo.split('/')[0];
    if (orgCounts[org] == null) orgCounts[org] = 0;
    orgCounts[org]++;
  }

  const orgs: string[] = [];
  for (const org of Object.keys(orgCounts)) {
    if (orgCounts[org] > 1) orgs.push(org);
  }

  const login = UserPrefRepo.getUser().login;
  return orgs.filter(org => org !== login);
}

const Label = styled(Text)`
  font-weight: ${fontWeight.bold};
`;
