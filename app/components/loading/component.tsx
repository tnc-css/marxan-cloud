import React from 'react';
import cx from 'classnames';

import Icon from 'components/icon';
import LOADING_SVG from 'svgs/ui/loading.svg?sprite';
import { motion, AnimatePresence } from 'framer-motion';

import { LoadingProps } from './types';

export const Loading: React.FC<LoadingProps> = ({
  visible = false,
  className = 'absolute',
  iconClassName = 'w-5 h-5',
}: LoadingProps) => {
  const variants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="loading"
          {...variants}
          className={cx({
            [className]: !!className,
          })}
        >
          <Icon icon={LOADING_SVG} className={iconClassName} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Loading;
