import React, {useState} from 'react';
import {StreamSetupBody, StreamSetupCheckBox, StreamSetupDesc, StreamSetupEmpty, StreamSetupFooter} from './StreamSetupCommon';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {TextInput} from '../../Library/View/TextInput';
import {space} from '../../Library/Style/layout';

type Props = {
  show: boolean;
  teams: string[]
  onFinish: (teams: string[]) => void;
  onBack: () => void;
};

export const StreamSetupTeamFragment: React.FC<Props> = (props) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>('');
  const filteredTeams = props.teams.filter(team => team.toLowerCase().includes(filter));

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
      <StreamSetupDesc>Jasperで閲覧したいチームを選択してください。この内容は後から変更できます。</StreamSetupDesc>
      <TextInput
        onChange={onChangeFilter}
        value={filter}
        style={{marginBottom: space.medium}}
        placeholder='チームをフィルターする'
      />
      <ScrollView>
        {teamViews}
        {teamViews.length === 0 && (
          <StreamSetupEmpty>所属しているチームは見つかりませんでした</StreamSetupEmpty>
        )}
      </ScrollView>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}>戻る</Button>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish(selectedTeams)} type='primary'>次へ</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
