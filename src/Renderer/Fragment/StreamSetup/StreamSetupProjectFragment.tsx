import React, {useState} from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupFooter, StreamSetupQueryDesc, StreamSetupSectionLabel} from './StreamSetupCommon';
import {CheckBox} from '../../Library/View/CheckBox';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';

type Props = {
  show: boolean;
  projects: ProjectProp[];
  onFinish: (projects: ProjectProp[]) => void;
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
    return <CheckBox key={project.url} checked={checked} onChange={() => toggleSelectedProject(project)} label={`${project.title} ${project.url}`}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupQueryDesc>プロジェクトに関するストリームを作成します。後から変更できます。</StreamSetupQueryDesc>
      <ScrollView>
        <StreamSetupSectionLabel>Projects</StreamSetupSectionLabel>
        {projectViews}
      </ScrollView>
      <StreamSetupFooter>
        <Button onClick={() => props.onFinish(selectedProjects)}>次へ</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
