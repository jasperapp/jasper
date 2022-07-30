import React, {useState} from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter} from './StreamSetupCommon';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {space} from '../../Library/Style/layout';
import {mc, Translate} from '../../Library/View/Translate';

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
      <StreamSetupDesc onMessage={mc => mc.streamSetup.project.desc}/>
      <TextInput
        onChange={onChangeFilter}
        value={filter}
        style={{marginBottom: space.medium}}
        placeholder={mc().streamSetup.project.filter}
      />
      <ScrollView>
        {projectViews}
        {projectViews.length === 0 && (
          <StreamSetupEmpty onMessage={mc => mc.streamSetup.project.empty}/>
        )}
      </ScrollView>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}><Translate onMessage={mc => mc.streamSetup.button.back}/></Button>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish(selectedProjects)} type='primary'><Translate onMessage={mc => mc.streamSetup.button.next}/></Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
