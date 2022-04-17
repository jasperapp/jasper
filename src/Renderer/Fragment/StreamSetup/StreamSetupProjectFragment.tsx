import React, {useState} from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter, StreamSetupSectionLabel} from './StreamSetupCommon';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';

type Props = {
  show: boolean;
  projects: ProjectProp[];
  onFinish: (projects: ProjectProp[]) => void;
  onBack: () => void;
};

export const StreamSetupProjectFragment: React.FC<Props> = (props) => {
  const [selectedProjects, setSelectedProjects] = useState<ProjectProp[]>([]);

  function toggleSelectedProject(project: ProjectProp) {
    const selected = selectedProjects.some(sp => sp.url === project.url);
    if (selected) {
      setSelectedProjects(selectedProjects.filter(sp => sp.url !== project.url));
    } else {
      setSelectedProjects([...selectedProjects, project]);
    }
  }

  const projectViews = props.projects.map(project => {
    const checked = selectedProjects.some(sp => sp.url === project.url);
    return <StreamSetupCheckBox key={project.url} checked={checked} onChange={() => toggleSelectedProject(project)} label={`${project.title} ${project.url}`}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>Jasperで閲覧したいプロジェクトを選択してください。この内容は後から変更できます。</StreamSetupDesc>
      <ScrollView>
        <StreamSetupSectionLabel>最近活動したGitHubプロジェクト</StreamSetupSectionLabel>
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
