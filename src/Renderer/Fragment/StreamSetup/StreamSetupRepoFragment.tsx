import React, {useMemo, useState} from 'react';
import {StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter, StreamSetupSectionLabel} from './StreamSetupCommon';
import {RemoteIssueEntity} from '../../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {space} from '../../Library/Style/layout';
import {View} from '../../Library/View/View';

type Props = {
  show: boolean;
  recentlyIssues: RemoteIssueEntity[];
  watchingRepos: string[];
  onFinish: (repos: string[]) => void;
};

export const StreamSetupRepoFragment: React.FC<Props> = (props) => {
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const recentlyRepos = useMemo(() => getRepositories(props.recentlyIssues), [props.recentlyIssues]);

  function toggleSelectedRepository(repo: string) {
    if (selectedRepos.includes(repo)) {
      setSelectedRepos(selectedRepos.filter(v => v !== repo));
    } else {
      setSelectedRepos([...selectedRepos, repo]);
    }
  }

  const recentlyRepoViews = recentlyRepos.map(repo => {
    const checked = selectedRepos.includes(repo);
    return <StreamSetupCheckBox key={repo} checked={checked} onChange={() => toggleSelectedRepository(repo)} label={repo}/>
  });

  const watchingRepoViews = props.watchingRepos.map(repo => {
    const checked = selectedRepos.includes(repo);
    return <StreamSetupCheckBox key={repo} checked={checked} onChange={() => toggleSelectedRepository(repo)} label={repo}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>Jasperで閲覧したいリポジトリを選択してください。この内容は後から変更できます。</StreamSetupDesc>
      <ScrollView>
        <StreamSetupSectionLabel>最近活動したリポジトリ</StreamSetupSectionLabel>
        {recentlyRepoViews}
        {recentlyRepoViews.length === 0 && (
          <StreamSetupEmpty>最近活動したリポジトリは見つかりませんでした</StreamSetupEmpty>
        )}

        <View style={{height: space.medium}}/>

        <StreamSetupSectionLabel>ウォッチしているリポジトリ（一部）</StreamSetupSectionLabel>
        {watchingRepoViews}
        {watchingRepoViews.length === 0 && (
          <StreamSetupEmpty>ウォッチしているリポジトリは見つかりませんでした</StreamSetupEmpty>
        )}
      </ScrollView>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish(selectedRepos)} type='primary'>次へ</Button>
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
