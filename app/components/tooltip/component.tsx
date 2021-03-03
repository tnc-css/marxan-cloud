import React from 'react';

import Tippy from '@tippyjs/react/headless';
import { useSpring, motion } from 'framer-motion';
import { SpringOptions } from 'popmotion';

import Arrow from './arrow';
import { TooltipProps } from './types';

export const Tooltip: React.FC<TooltipProps> = ({
  children, content, arrow, ...props
}: TooltipProps) => {
  const springConfig: SpringOptions = { damping: 15, stiffness: 300 };
  const opacity = useSpring(0, springConfig);
  const scale = useSpring(0.95, springConfig);

  function onMount() {
    scale.set(1);
    opacity.set(1);
  }

  function onHide({ unmount }) {
    const cleanup = scale.onChange((value) => {
      if (value <= 0.95) {
        cleanup();
        unmount();
      }
    });

    scale.set(0.95);
    opacity.set(0);
  }

  return (
    <Tippy
      {...props}
      render={(attrs) => (
        <motion.div style={{ scale, opacity }} {...attrs}>
          <div className="relative text-gray-500 bg-white rounded">
            {content}

            {arrow && <Arrow data-popper-arrow="" {...attrs} />}
          </div>
        </motion.div>
      )}
      animation
      onMount={onMount}
      onHide={onHide}
    >
      {children}
    </Tippy>
  );
};

export default Tooltip;
