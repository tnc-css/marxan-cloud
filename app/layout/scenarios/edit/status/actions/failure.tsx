import React, {
  useCallback,
} from 'react';

import { useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import { useSaveScenario, useScenario } from 'hooks/scenarios';
import { useToasts } from 'hooks/toast';

export const useScenarioActionsFailure = () => {
  const { query } = useRouter();
  const { sid } = query;

  const dispatch = useDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const {
    setJob,
  } = scenarioSlice.actions;

  const { data: scenarioData } = useScenario(sid);

  const scenarioMutation = useSaveScenario({
    requestConfig: {
      method: 'PATCH',
    },
  });

  const { addToast } = useToasts();

  // WDPA protected calculation
  const onPlanningAreaProtectedCalculationFailure = useCallback(() => {
    scenarioMutation.mutate({
      id: `${sid}`,
      data: {
        metadata: {
          ...scenarioData?.metadata,
          scenarioEditingMetadata: {
            ...scenarioData?.metadata?.scenarioEditingMetadata,
            subtab: 'protected-areas-preview',
            lastJobCheck: new Date().getTime(),
          },
        },
      },
    }, {
      onSuccess: () => {
        dispatch(setJob(null));
      },
      onError: () => {
        addToast('onPlanningAreaProtectedCalculationFailure', (
          <>
            <h2 className="font-medium">Error!</h2>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Features
  const onFeaturesFailure = useCallback(() => {
    scenarioMutation.mutate({
      id: `${sid}`,
      data: {
        metadata: {
          ...scenarioData?.metadata,
          scenarioEditingMetadata: {
            ...scenarioData?.metadata?.scenarioEditingMetadata,
            tab: 'features',
            subtab: 'features-preview',
            status: {
              'protected-areas': 'draft',
              features: 'draft',
              analysis: 'empty',
            },
            lastJobCheck: new Date().getTime(),
          },
        },
      },
    }, {
      onSuccess: () => {
        dispatch(setJob(null));
      },
      onError: () => {
        addToast('onPlanningAreaProtectedCalculationDone', (
          <>
            <h2 className="font-medium">Error!</h2>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [
    sid,
    scenarioMutation,
    scenarioData?.metadata,
    dispatch,
    setJob,
    addToast,
  ]);

  // Cost surface
  const onCostSurfaceFailure = useCallback(() => {
    scenarioMutation.mutate({
      id: `${sid}`,
      data: {
        metadata: {
          ...scenarioData?.metadata,
          scenarioEditingMetadata: {
            ...scenarioData?.metadata?.scenarioEditingMetadata,
            lastJobCheck: new Date().getTime(),
          },
        },
      },
    }, {
      onSuccess: () => {
        dispatch(setJob(null));
      },
      onError: () => {
        addToast('onCostSurfaceFailure', (
          <>
            <h2 className="font-medium">Error!</h2>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Planning units inclusion
  const onPlanningUnitsInclusionFailure = useCallback(() => {
    scenarioMutation.mutate({
      id: `${sid}`,
      data: {
        metadata: {
          ...scenarioData?.metadata,
          scenarioEditingMetadata: {
            ...scenarioData?.metadata?.scenarioEditingMetadata,
            lastJobCheck: new Date().getTime(),
          },
        },
      },
    }, {
      onSuccess: () => {
        dispatch(setJob(null));
      },
      onError: () => {
        addToast('onPlanningUnitsInclusionFailure', (
          <>
            <h2 className="font-medium">Error!</h2>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  // Run marxan
  const onRunFailure = useCallback(() => {
    scenarioMutation.mutate({
      id: `${sid}`,
      data: {
        metadata: {
          ...scenarioData?.metadata,
          scenarioEditingMetadata: {
            ...scenarioData?.metadata?.scenarioEditingMetadata,
            lastJobCheck: new Date().getTime(),
          },
        },
      },
    }, {
      onSuccess: () => {
        dispatch(setJob(null));
      },
      onError: () => {
        addToast('onRunFailure', (
          <>
            <h2 className="font-medium">Error!</h2>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [sid, scenarioMutation, scenarioData?.metadata, dispatch, setJob, addToast]);

  return {
    features: onFeaturesFailure,
    planningAreaProtectedCalculation: onPlanningAreaProtectedCalculationFailure,
    costSurface: onCostSurfaceFailure,
    planningUnitsInclusion: onPlanningUnitsInclusionFailure,
    run: onRunFailure,
  };
};