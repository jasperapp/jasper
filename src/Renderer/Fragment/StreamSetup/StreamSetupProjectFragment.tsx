import React, {useState} from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter} from './StreamSetupCommon';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {space} from '../../Library/Style/layout';

type Props = {
  show: boolean;
  projects: ProjectProp[];
  onFinish: (projects: ProjectProp[]) => void;
  onBack: () => void;
};

export const StreamSetupProjectFragment: React.FC<Props> = (props) => {
  const [selectedProjects, setSelectedProjects] = useState<ProjectProp[]>([]);
  const [filter, setFilter] = useState<string>('');
  const filteredProjects = props.projects.filter(project => {
    return project.url.toLowerCase().includes(filter) || project.title.toLowerCase().includes(filter);
  });

  function toggleSelectedProject(project: ProjectProp) {
    const selected = selectedProjects.some(sp => sp.url === project.url);
    if (selected) {
      setSelectedProjects(selectedProjects.filter(sp => sp.url !== project.url));
    } else {
      setSelectedProjects([...selectedProjects, project]);
    }
  }

  function onChangeFilter(filter: string) {
    setFilter(filter.toLowerCase());
  }

  const projectViews = filteredProjects.map(project => {
    const checked = selectedProjects.some(sp => sp.url === project.url);
    return <StreamSetupCheckBox key={project.url} checked={checked} onChange={() => toggleSelectedProject(project)} label={`${project.title} ${project.url}`}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>Jasperで閲覧したいGitHubプロジェクトを選択してください。この内容は後から変更できます。</StreamSetupDesc>
      <TextInput
        onChange={onChangeFilter}
        value={filter}
        style={{marginBottom: space.medium}}
        placeholder='GitHubプロジェクトをフィルターする'
      />
      <ScrollView>
        {projectViews}
        {projectViews.length === 0 && (
          <StreamSetupEmpty>最近活動したGitHubプロジェクトは見つかりませんでした</StreamSetupEmpty>
        )}
      </ScrollView>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}>戻る</Button>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish(selectedProjects)} type='primary'>次へ</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
