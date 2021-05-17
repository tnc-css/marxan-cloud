import React, { useCallback, useState } from 'react';
import cx from 'classnames';

import { AnimatePresence, motion } from 'framer-motion';

import Pill from 'layout/pill';
import Sections from 'layout/scenarios/sidebar/analysis/sections';
import GapAnalysis from 'layout/scenarios/sidebar/analysis/gap-analysis';
import CostSurface from 'layout/scenarios/sidebar/analysis/cost-surface';
import AdjustPanningUnits from 'layout/scenarios/sidebar/analysis/adjust-planning-units';

import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import { useScenario } from 'hooks/scenarios';

export interface ScenariosSidebarAnalysisProps {
}

export const ScenariosSidebarAnalysis: React.FC<ScenariosSidebarAnalysisProps> = () => {
  const [section, setSection] = useState(null);
  const { query } = useRouter();
  const { sid } = query;

  const { tab } = useSelector((state) => state[`/scenarios/${sid}/edit`]);

  const { data: scenarioData } = useScenario(sid);

  // CALLBACKS
  const onChangeSection = useCallback((s) => {
    setSection(s);
  }, []);

  if (!scenarioData || tab !== 'analysis') return null;

  return (
    <motion.div
      key="analysis"
      className="flex flex-col min-h-0 overflow-hidden"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence>
        <Pill selected>
          <header className="flex justify-between flex-shrink-0">
            <div>
              <div className="flex items-baseline space-x-4">
                <h2 className="text-lg font-medium font-heading">Analysis</h2>
              </div>
            </div>
          </header>

          {!section && (
            <Sections
              key="sections"
              onChangeSection={onChangeSection}
            />
          )}

          {section === 'gap-analysis' && (
            <GapAnalysis
              key="gap-analysis"
              onChangeSection={onChangeSection}
            />
          )}

          {section === 'cost-surface' && (
            <CostSurface
              key="cost-surface"
              onChangeSection={onChangeSection}
            />
          )}

          {section === 'adjust-planning-units' && (
            <AdjustPanningUnits
              key="adjust-planning-units"
              onChangeSection={onChangeSection}
            />
          )}
        </Pill>

        {!section && (
          <motion.div
            key="run-scenario-button"
            className="flex justify-center flex-shrink-0 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              type="button"
              className={cx({
                'relative text-white bg-transparent border border-transparent hover:bg-gray-400 active:bg-gray-300 hover:border-transparent active:border-transparent group': true,
                'text-base': true,
                'flex items-center justify-center rounded-4xl focus:outline-none': true,
              })}
            >
              <div className="absolute top-0 bottom-0 left-0 right-0 z-0 -m-px rounded-4xl bg-gradient-to-r from-purple-500 to-blue-500" />
              <div className="relative z-10 px-8 py-3 transition-colors bg-black rounded-4xl group-hover:bg-transparent">Run scenario</div>
            </button>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScenariosSidebarAnalysis;
