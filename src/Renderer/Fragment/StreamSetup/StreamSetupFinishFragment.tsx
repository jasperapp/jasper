import React from 'react';
import {StreamSetupBody, StreamSetupDesc, StreamSetupFooter} from './StreamSetupCommon';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {Link} from '../../Library/View/Link';
import {DocsUtil} from '../../Library/Util/DocsUtil';
import {Translate} from '../../Library/View/Translate';

type Props = {
  show: boolean;
  onFinish: () => void;
};

export const StreamSetupFinishFragment: React.FC<Props> = (props) => {
  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc
        onMessage={mc => mc.streamSetup.finish.desc}
        values={{handbook: <Link url={DocsUtil.getTopURL()}> Jasper Handbook </ Link>}}
      />
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish()} type='primary'><Translate onMessage={mc => mc.streamSetup.button.close}/></Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
