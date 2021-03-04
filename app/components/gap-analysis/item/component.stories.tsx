import React from 'react';
import { Story } from '@storybook/react/types-6-0';
import Item, { ItemProps } from './component';

export default {
  title: 'Components/GapAnalysis/Item',
  component: Item,
  argTypes: {},
};

const Template: Story<ItemProps> = ({ ...args }) => (
  <Item {...args} />
);

export const Default: Story<ItemProps> = Template.bind({});
Default.args = {
  name: 'Lion in Deserts and Xeric Shrublands',
  current: {
    percent: 0.05,
    value: 22,
    unit: 'km²',
  },
  target: {
    percent: 0.17,
    value: 30,
    unit: 'km²',
  },
  onMap: false,
  onToggleOnMap: (onMap) => console.log(onMap),
  muted: false,
  onMouseEnter: (e) => console.log(e),
  onMouseLeave: (e) => console.log(e),
};
