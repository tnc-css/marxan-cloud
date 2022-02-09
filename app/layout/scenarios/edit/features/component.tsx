import React, { useCallback, useEffect } from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import { AnimatePresence, motion } from 'framer-motion';
import { ScenarioSidebarSubTabs, ScenarioSidebarTabs } from 'utils/tabs';

import { useProjectRole } from 'hooks/project-users';
import { useScenario } from 'hooks/scenarios';

import Pill from 'layout/pill';
import GapAnalysis from 'layout/scenarios/edit/features/gap-analysis';
import SetUpFeatures from 'layout/scenarios/edit/features/set-up';
import Sections from 'layout/sections';

import Button from 'components/button';

const SECTIONS = [
  {
    id: ScenarioSidebarSubTabs.FEATURES_ADD,
    name: 'Set up features',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
  {
    id: ScenarioSidebarSubTabs.PRE_GAP_ANALYSIS,
    name: 'Gap Analysis',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
];
export interface ScenariosSidebarFeaturesProps {

}

export const ScenariosSidebarFeatures: React.FC<ScenariosSidebarFeaturesProps> = (

) => {
  const { query } = useRouter();
  const { pid, sid } = query;

  const { data: projectRole } = useProjectRole(pid);
  const VIEWER = projectRole === 'project_viewer';

  const scenarioSlice = getScenarioEditSlice(sid);
  const { setTab, setSubTab } = scenarioSlice.actions;

  const { tab, subtab } = useSelector((state) => state[`/scenarios/${sid}/edit`]);
  const dispatch = useDispatch();

  const { data: scenarioData } = useScenario(sid);

  // EFFECTS
  useEffect(() => {
    // Check that the subtab is a valid features subtab
    if (!SECTIONS.find((s) => s.id === subtab)) {
      dispatch(setSubTab(null));
    }
  }, []); // eslint-disable-line

  // CALLBACKS
  const onChangeSection = useCallback((s) => {
    const sub = s || null;
    dispatch(setSubTab(sub));
  }, [dispatch, setSubTab]);

  const onContinue = useCallback(() => {
    dispatch(setTab(ScenarioSidebarTabs.PARAMETERS));
    dispatch(setSubTab(null));
  }, [dispatch, setTab, setSubTab]);

  if (!scenarioData || tab !== ScenarioSidebarTabs.FEATURES) return null;

  return (
    <div className="flex flex-col flex-grow w-full h-full overflow-hidden">
      <motion.div
        key="planning-unit"
        className="flex flex-col min-h-0 overflow-hidden"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <AnimatePresence>
          <Pill selected>
            <header className="flex justify-between flex-shrink-0">
              <div>
                <div className="flex items-baseline space-x-4">
                  <h2 className="text-lg font-medium font-heading">Sorting out the features</h2>
                </div>
              </div>
            </header>

            {!subtab && (
              <Sections
                key="sections"
                sections={SECTIONS}
                onChangeSection={onChangeSection}
              />
            )}

            {(subtab === ScenarioSidebarSubTabs.FEATURES_ADD
              || subtab === ScenarioSidebarSubTabs.FEATURES_TARGET)
              && (
                <SetUpFeatures
                  key="set-up-features"
                />
              )}

            {subtab === ScenarioSidebarSubTabs.PRE_GAP_ANALYSIS && (
              <GapAnalysis
                key="gap-analysis"
                onChangeSection={onChangeSection}
              />
            )}
          </Pill>

          {!subtab && (
            <motion.div
              key="continue-scenario-button"
              className="flex justify-center flex-shrink-0 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                theme="primary"
                size="lg"
                disabled={VIEWER}
                onClick={onContinue}
              >
                Continue
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>

  );
};

export default ScenariosSidebarFeatures;
