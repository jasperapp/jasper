import React, {useState} from 'react';
import {StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter} from './StreamSetupCommon';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {space} from '../../Library/Style/layout';
import {mc, Translate} from '../../Library/View/Translate';

type Props = {
  show: boolean;
  teams: string[]
  onFinish: (teams: string[]) => void;
  onBack: () => void;
};

export const StreamSetupTeamFragment: React.FC<Props> = (props) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const filteredTeams = props.teams.filter(team => team.toLowerCase().includes(filter)).sort();

  function toggleSelectedTeam(team: string) {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(selectedTeams.filter(v => v !== team));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  }

  function onChangeFilter(filter: string) {
    setFilter(filter.toLowerCase());
  }

  const teamViews = filteredTeams.map(team => {
    const checked = selectedTeams.includes(team);
    return <StreamSetupCheckBox key={team} checked={checked} onChange={() => toggleSelectedTeam(team)} label={team}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc onMessage={mc => mc.streamSetup.team.desc}/>
      <TextInput
        onChange={onChangeFilter}
        value={filter}
        style={{marginBottom: space.medium}}
        placeholder={mc().streamSetup.team.filter}
      />
      <ScrollView>
        {teamViews}
        {teamViews.length === 0 && (
          <StreamSetupEmpty onMessage={mc => mc.streamSetup.team.empty}/>
        )}
      </ScrollView>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}><Translate onMessage={mc => mc.streamSetup.button.back}/></Button>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish(selectedTeams)} type='primary'><Translate onMessage={mc => mc.streamSetup.button.next}/></Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
