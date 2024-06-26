import React from 'react';

import { useRouter } from 'next/router';

import { motion } from 'framer-motion';

import { useSelectedFeatures } from 'hooks/features';

import Icon from 'components/icon';

import FEATURES_SVG from 'svgs/ui/features.svg?sprite';

import TargetFeatures from './list';

export const ScenariosSidebarEditFeatures = ({ onGoBack }): JSX.Element => {
  const { query } = useRouter();
  const { sid } = query as { pid: string; sid: string };

  const { data: selectedFeaturesData } = useSelectedFeatures(sid, {});

  return (
    <div className="flex h-full max-h-[90vh] w-full flex-grow flex-col overflow-hidden">
      <motion.div
        key="features"
        className="flex min-h-0 flex-col overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <header className="flex flex-shrink-0 items-start justify-between">
          <div>
            <div className="flex items-baseline space-x-4">
              <h2 className="font-heading text-lg font-medium">Target and SPF</h2>
              {/* <InfoButton>
                <div>
                  <h4 className="font-heading text-lg mb-2.5">What are features?</h4>
                  <div className="space-y-2">
                    <p>
                      Features are the important habitats, species, processes,
                      activities, and discrete areas that you want to consider
                      in your planning process. Common feature data formats are
                      range maps, polygons, abundances, and continuous scale or
                      probability of occurrence maps (e.g. 0-1). Features can
                      include more than just ecological data but also be cultural
                      and socio-economic areas like community fishing grounds
                      or traditional-use areas, and other human activities and
                      industries. Every feature must have a minimum target
                      amount set.
                      Some examples include:
                    </p>
                    <img src={FEATURE_SPECIES_IMG} alt="Feature-Range" />
                    <img src={FEATURE_ABUND_IMG} alt="Feature-Abundance" />
                    <img src={FEATURE_SOCIAL_IMG} alt="Feature-Social" />
                  </div>
                </div>
              </InfoButton> */}
            </div>

            <div className="mt-2 flex items-center space-x-2">
              <Icon icon={FEATURES_SVG} className="h-4 w-4 text-gray-100" />
              <div className="font-heading text-xs uppercase">
                Features:{' '}
                {selectedFeaturesData && (
                  <span className="ml-1 text-gray-100">{selectedFeaturesData.length}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        <TargetFeatures onGoBack={onGoBack} />
      </motion.div>
    </div>
  );
};

export default ScenariosSidebarEditFeatures;
