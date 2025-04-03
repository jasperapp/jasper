import React from 'react';
import {ProjectProp, StreamSetupBody, StreamSetupDesc, StreamSetupFooter} from './StreamSetupCommon';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {mc, Translate} from '../../Library/View/Translate';
import {Text} from '../../Library/View/Text';
import {space} from '../../Library/Style/layout';

type Props = {
  show: boolean;
  projects: ProjectProp[];
  onFinish: (projects: ProjectProp[]) => void;
  onBack: () => void;
};

export const StreamSetupProjectFragment: React.FC<Props> = (props) => {
  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc onMessage={mc => mc.streamSetup.project.desc}/>
      <View style={{marginBottom: space.medium, marginTop: space.large}}>
        <Text style={{fontWeight: 'bold', fontSize: '16px', color: 'red'}}>
          GitHub Projects Classic has been sunset
        </Text>
        <Text style={{marginTop: space.medium}}>
          GitHub has discontinued their Projects Classic feature, and this functionality is no longer available.
          Please see GitHub's announcement at: https://github.blog/changelog/2024-05-23-sunset-notice-projects-classic/
        </Text>
        <Text style={{marginTop: space.medium}}>
          Please use a different stream type instead.
        </Text>
      </View>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <Button onClick={props.onBack}><Translate onMessage={mc => mc.streamSetup.button.back}/></Button>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish([])} type='primary'><Translate onMessage={mc => mc.streamSetup.button.next}/></Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
