import React, {
  ReactElement, cloneElement,
  useRef,
} from 'react';

import cx from 'classnames';

import Tooltip from 'components/tooltip';

const THEME = {
  dark: {
    base: 'px-4 py-1.5 text-xs text-white bg-gray-500 rounded',
    arrow: 'bg-gray-500',
  },
  light: {
    base: 'px-4 py-1.5 text-xs text-gray-500 bg-white rounded',
    arrow: 'bg-white',
  },
};
export interface ComingSoonProps {
  children: ReactElement;
  placement?: string;
  theme?: 'dark' | 'light';
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  children,
  theme = 'light',
}: ComingSoonProps) => {
  const childrenRef = useRef(null);

  const CHILDREN = cloneElement(children, {
    ref: childrenRef,
  });

  return (
    <Tooltip
      arrow
      arrowClassName={cx({
        [THEME[theme].arrow]: true,
      })}
      placement="bottom"
      maxWidth={350}
      content={(
        <div
          className={cx({
            [THEME[theme].base]: true,
          })}
        >
          <span>Feature coming soon!</span>
        </div>
      )}
    >
      <div className="opacity-30">
        <div className="pointer-events-none">
          {CHILDREN}
        </div>
      </div>
    </Tooltip>
  );
};

export default ComingSoon;