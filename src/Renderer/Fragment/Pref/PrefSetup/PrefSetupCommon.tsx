import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {fontWeight, space} from '../../../Library/Style/layout';
import {DraggableHeader} from '../../../Library/View/DraggableHeader';
import {Text} from '../../../Library/View/Text';
import {appTheme} from '../../../Library/Style/appTheme';

export const PrefSetupBody = styled(View)`
  flex: 1;
  padding: 0 ${space.large}px;
  height: 100%;
`;

export const PrefSetupSlimDraggableHeader = styled(DraggableHeader)`
  min-height: ${space.large}px;
`;

export const PrefSetupRow = styled(View)`
  flex-direction: row;
  align-items: center;
`;

export const PrefSetupSpace = styled(View)`
  height: ${space.large}px;
`;

export const PrefSetupBodyLabel = styled(View)`
  padding-right: ${space.medium}px;
  flex-direction: row;
`;

export const PrefSetupScopeName = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;
