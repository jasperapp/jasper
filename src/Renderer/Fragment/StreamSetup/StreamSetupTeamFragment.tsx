import React, {useState} from 'react';
import {StreamSetupBody, StreamSetupCheckBox, StreamSetupFooter, StreamSetupQueryDesc, StreamSetupSectionLabel} from './StreamSetupCommon';
import {ScrollView} from '../../Library/View/ScrollView';
import {Button} from '../../Library/View/Button';

type Props = {
  show: boolean;
  teams: string[]
  onFinish: (teams: string[]) => void;
};

export const StreamSetupTeamFragment: React.FC<Props> = (props) => {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  function toggleSelectedTeam(team: string) {
    if (selectedTeams.includes(team)) {
      setSelectedTeams(selectedTeams.filter(v => v !== team));
    } else {
      setSelectedTeams([...selectedTeams, team]);
    }
  }

  const teamViews = props.teams.map(team => {
    const checked = selectedTeams.includes(team);
    return <StreamSetupCheckBox key={team} checked={checked} onChange={() => toggleSelectedTeam(team)} label={team}/>
  });

  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupQueryDesc>チームに関するストリームを作成します。後から変更できます。</StreamSetupQueryDesc>
      <ScrollView>
        <StreamSetupSectionLabel>Teams</StreamSetupSectionLabel>
        {teamViews}
      </ScrollView>
      <StreamSetupFooter>
        <Button onClick={() => props.onFinish(selectedTeams)}>次へ</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
