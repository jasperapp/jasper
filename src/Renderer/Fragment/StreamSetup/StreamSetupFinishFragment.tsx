import React from 'react';
import {StreamSetupBody, StreamSetupDesc, StreamSetupFooter} from './StreamSetupCommon';
import {Button} from '../../Library/View/Button';
import {View} from '../../Library/View/View';
import {Translate} from '../../Library/View/Translate';
import {Link} from '../../Library/View/Link';
import {DocsUtil} from '../../Library/Util/DocsUtil';

type Props = {
  show: boolean;
  onFinish: () => void;
};

export const StreamSetupFinishFragment: React.FC<Props> = (props) => {
  return (
    <StreamSetupBody style={{display: props.show ? undefined : 'none'}}>
      <StreamSetupDesc>
        <Translate
          onMessage={mc => mc.intro.desc}
          values={{handbook: <Link url={DocsUtil.getTopURL()}> Jasper Handbook </ Link>}}
        />
      </StreamSetupDesc>
      <View style={{flex: 1}}/>
      <StreamSetupFooter>
        <View style={{flex: 1}}/>
        <Button onClick={() => props.onFinish()} type='primary'>閉じる</Button>
      </StreamSetupFooter>
    </StreamSetupBody>
  );
}
