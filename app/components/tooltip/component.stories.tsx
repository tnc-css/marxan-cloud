import React from 'react';
import { Story } from '@storybook/react/types-6-0';
import Tooltip, { TooltipProps } from './component';

export default {
  title: 'Components/Tooltip',
  component: Tooltip,
  argTypes: {},
};

const Template: Story<TooltipProps> = ({ children, ...args }: TooltipProps) => (
  <p>
    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Odit
    {' '}
    <Tooltip
      {...args}
      content={(<span>Tooltip</span>)}
    >
      {children}
    </Tooltip>
    {' '}
    quisquam explicabo iure nihil, eveniet dolorum at hic voluptatem in maxime enim a aspernatur?
    {' '}
    <Tooltip
      {...args}
      trigger="click"
      placement="bottom-start"
      content={(
        <div className="p-5">
          <h2 className="text-lg text-primary-500">Title</h2>
          <p>This is a content. We could have whateveryouwant</p>
        </div>
      )}
    >
      {children}
    </Tooltip>
    , doloremque iusto! Sunt, dignissimos sint.

  </p>
);

export const Default = Template.bind({});
Default.args = {
  children: (
    <span className="text-primary-500">Source name</span>
  ),
  content: (
    <div className="p-5">
      <h2 className="text-lg text-primary-500">Title</h2>
      <p>This is a content. We could have whateveryouwant</p>
    </div>
  ),
};
