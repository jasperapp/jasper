import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {space} from '../../Library/Style/layout';
import {Text} from '../../Library/View/Text';

export type ProjectProp = {
  url: string;
  title: string;
};

export const StreamSetupBody = styled(View)`
  flex: 1;
  padding: ${space.large}px;
  height: 100%;
`;

export const StreamSetupQueryDesc = styled(Text)`
`;

export const StreamSetupSectionLabel = styled(Text)`
`;

export const StreamSetupFooter = styled(View)`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  min-height: 60px;
`;
