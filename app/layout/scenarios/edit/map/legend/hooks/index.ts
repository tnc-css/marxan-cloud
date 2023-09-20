import { useRouter } from 'next/router';

import { useAppDispatch, useAppSelector } from 'store/hooks';
import { getScenarioEditSlice } from 'store/slices/scenarios/edit';

import chroma from 'chroma-js';
import { orderBy, sortBy } from 'lodash';

import { useProjectCostSurfaces } from 'hooks/cost-surface';
import { useSelectedFeatures } from 'hooks/features';
import { useAllGapAnalysis } from 'hooks/gap-analysis';
import { COLORS, LEGEND_LAYERS } from 'hooks/map/constants';
import { useProject } from 'hooks/projects';
import { useScenario } from 'hooks/scenarios';
import { useWDPACategories } from 'hooks/wdpa';

import { CostSurface } from 'types/api/cost-surface';
import { Feature } from 'types/api/feature';
import { WDPA } from 'types/api/wdpa';

export const usePlanningGridLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { pid: string; sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { layerSettings } = useAppSelector((state) => state[`/scenarios/${sid}/edit`]);

  return LEGEND_LAYERS['pugrid']({
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'pugrid',
          settings: {
            visibility: !layerSettings['pugrid']?.visibility,
          },
        })
      );
    },
  });
};

export const useCostSurfaceLegend = () => {
  const { query } = useRouter();
  const { pid, sid } = query as { pid: string; sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { layerSettings, selectedCostSurface } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const costSurfaceQuery = useProjectCostSurfaces(
    pid,
    {},
    {
      select: (data) => data.filter(({ id }) => selectedCostSurface === id),
    }
  );

  if (!costSurfaceQuery.data?.length) return [];

  return LEGEND_LAYERS['cost-surface']({
    items: costSurfaceQuery.data,
    onChangeVisibility: (costSurfaceId: CostSurface['id']) => {
      dispatch(
        setLayerSettings({
          id: costSurfaceId,
          settings: {
            visibility: !layerSettings[costSurfaceId]?.visibility,
          },
        })
      );
    },
  });
};

export const useConservationAreasLegend = () => {
  const { query } = useRouter();
  const { pid, sid } = query as { pid: string; sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { layerSettings } = useAppSelector((state) => state[`/scenarios/${sid}/edit`]);

  const { data: projectData } = useProject(pid);
  const WDPACategoriesQuery = useWDPACategories({
    adminAreaId:
      projectData?.adminAreaLevel2Id || projectData?.adminAreaLevel1I || projectData?.countryId,
    customAreaId:
      !projectData?.adminAreaLevel2Id && !projectData?.adminAreaLevel1I && !projectData?.countryId
        ? projectData?.planningAreaId
        : null,
    scenarioId: sid,
  });

  const items = orderBy(WDPACategoriesQuery.data, ['kind'], ['desc'])?.map(
    ({ id, name, kind }) => ({
      id,
      name: kind === 'global' ? `IUCN ${name}` : name,
    })
  );

  return LEGEND_LAYERS['designated-areas']({
    items,
    onChangeVisibility: (WDPAId: WDPA['id']) => {
      dispatch(
        setLayerSettings({
          id: WDPAId,
          settings: {
            visibility: !layerSettings[WDPAId]?.visibility,
          },
        })
      );
    },
  });
};

export const useFeatureAbundanceLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useAppDispatch();
  const { data: features } = useSelectedFeatures(sid);
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;

  const { layerSettings } = useAppSelector((state) => state[`/scenarios/${sid}/edit`]);

  const totalItems = features?.length || 0;

  const items =
    features?.map(({ id, name, amountRange = { min: 5000, max: 100000 } }, index) => {
      const color =
        totalItems > COLORS['features-preview'].ramp.length
          ? chroma.scale(COLORS['features-preview'].ramp).colors(totalItems)[index]
          : COLORS['features-preview'].ramp[index];

      return {
        id,
        name,
        amountRange,
        color,
      };
    }) || [];

  return LEGEND_LAYERS['features-abundance']({
    items,
    onChangeVisibility: (featureId: Feature['id']) => {
      const { color, amountRange } = items.find(({ id }) => id === featureId) || {};

      dispatch(
        setLayerSettings({
          id: featureId,
          settings: {
            visibility: !layerSettings[featureId]?.visibility,
            amountRange,
            color,
          },
        })
      );
    },
  });
};

export const useFeaturesLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useAppDispatch();
  const { data: features } = useSelectedFeatures(sid);
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setSelectedFeatures, setLayerSettings } = scenarioSlice.actions;
  const { selectedFeatures }: { selectedFeatures: Feature['id'][] } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const totalItems = features?.length || 0;

  const items =
    features?.map(({ id, name }, index) => {
      const color =
        totalItems > COLORS['features-preview'].ramp.length
          ? chroma.scale(COLORS['features-preview'].ramp).colors(totalItems)[index]
          : COLORS['features-preview'].ramp[index];

      return {
        id,
        name,
        color,
      };
    }) || [];

  return LEGEND_LAYERS['features-preview-new']({
    items,
    onChangeVisibility: (featureId: Feature['id']) => {
      const newSelectedFeatures = [...selectedFeatures];
      const isIncluded = newSelectedFeatures.includes(featureId);
      if (!isIncluded) {
        newSelectedFeatures.push(featureId);
      } else {
        const i = newSelectedFeatures.indexOf(featureId);
        newSelectedFeatures.splice(i, 1);
      }
      dispatch(setSelectedFeatures(newSelectedFeatures));

      const { color } = items.find(({ id }) => id === featureId) || {};

      dispatch(
        setLayerSettings({
          id: featureId,
          settings: {
            visibility: !isIncluded,
            color,
          },
        })
      );
    },
  });
};

export const useLockInLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;

  const { puTmpIncludedValue, puIncludedValue, layerSettings } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const totalIncludedAreas = [...puIncludedValue, ...puTmpIncludedValue];

  if (!totalIncludedAreas.length) return null;

  return LEGEND_LAYERS['lock-in']({
    puIncludedValue: totalIncludedAreas,
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'lock-in',
          settings: {
            visibility: !layerSettings['lock-in']?.visibility,
          },
        })
      );
    },
  });
};

export const useLockOutLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;

  const { puTmpExcludedValue, puExcludedValue, layerSettings } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const totalExcludedAreas = [...puExcludedValue, ...puTmpExcludedValue];

  if (!totalExcludedAreas.length) return null;

  return LEGEND_LAYERS['lock-out']({
    puExcludedValue: totalExcludedAreas,
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'lock-out',
          settings: {
            visibility: !layerSettings['lock-out']?.visibility,
          },
        })
      );
    },
  });
};

export const useLockAvailableLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { puTmpAvailableValue, puAvailableValue, layerSettings } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const totalAvailableAreas = [...puAvailableValue, ...puTmpAvailableValue];

  if (!totalAvailableAreas.length) return null;

  return LEGEND_LAYERS['lock-available']({
    puAvailableValue: totalAvailableAreas,
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'lock-available',
          settings: {
            visibility: !layerSettings['lock-available']?.visibility,
          },
        })
      );
    },
  });
};

export const useWDPAPreviewLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { layerSettings } = useAppSelector((state) => state[`/scenarios/${sid}/edit`]);

  return LEGEND_LAYERS['wdpa-percentage']({
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'wdpa-percentage',
          settings: {
            visibility: !layerSettings['wdpa-percentage']?.visibility,
          },
        })
      );
    },
  });
};

export const useGapAnalysisLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };
  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings, setPreHighlightFeatures } = scenarioSlice.actions;
  const { layerSettings, preHighlightFeatures } = useAppSelector(
    (state) => state[`/scenarios/${sid}/edit`]
  );

  const gapAnalysisQuery = useAllGapAnalysis(sid, {
    select: (data) =>
      sortBy(
        data.map(({ id, featureClassName }) => ({
          id,
          name: featureClassName,
        })),
        ['name']
      ),
  });

  return LEGEND_LAYERS['gap-analysis']({
    items: gapAnalysisQuery.data,
    onChangeVisibility: (featureId: Feature['id']) => {
      const newPreHighlightFeatures = [...preHighlightFeatures];
      const isIncluded = newPreHighlightFeatures.includes(featureId);
      if (!isIncluded) {
        newPreHighlightFeatures.push(featureId);
      } else {
        const i = newPreHighlightFeatures.indexOf(featureId);
        newPreHighlightFeatures.splice(i, 1);
      }
      dispatch(setPreHighlightFeatures(newPreHighlightFeatures));

      dispatch(
        setLayerSettings({
          id: featureId,
          settings: {
            visibility: !layerSettings[featureId]?.visibility,
          },
        })
      );
    },
  });
};

export const useFrequencyLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };
  const scenarioQuery = useScenario(sid);

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { layerSettings } = useAppSelector((state) => state[`/scenarios/${sid}/edit`]);

  if (!scenarioQuery.data?.ranAtLeastOnce) return null;

  return LEGEND_LAYERS['frequency']({
    numberOfRuns: scenarioQuery.data?.numberOfRuns,
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'frequency',
          settings: {
            visibility: !layerSettings['frequency']?.visibility,
          },
        })
      );
    },
  });
};

export const useSolutionsLegend = () => {
  const { query } = useRouter();
  const { sid } = query as { sid: string };

  const scenarioQuery = useScenario(sid);

  const dispatch = useAppDispatch();
  const scenarioSlice = getScenarioEditSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;
  const { layerSettings } = useAppSelector((state) => state[`/scenarios/${sid}/edit`]);

  if (!scenarioQuery.data?.ranAtLeastOnce) return null;

  return LEGEND_LAYERS['solution']({
    onChangeVisibility: () => {
      dispatch(
        setLayerSettings({
          id: 'solution',
          settings: {
            visibility: !layerSettings['solution']?.visibility,
          },
        })
      );
    },
  });
};

export const useScenarioLegend = () => {
  return [
    {
      name: 'Planning Grid',
      layers: [
        usePlanningGridLegend(),
        ...useCostSurfaceLegend(),
        useLockInLegend(),
        useLockOutLegend(),
        useLockAvailableLegend(),
        useWDPAPreviewLegend(),
        useFrequencyLegend(),
        useSolutionsLegend(),
      ],
      subgroups: [
        {
          name: 'Features',
          layers: useGapAnalysisLegend(),
        },
      ],
    },
    {
      name: 'Conservation Areas',
      layers: useConservationAreasLegend(),
    },
    {
      name: 'Features (Continuous)',
      layers: useFeatureAbundanceLegend(),
    },
    {
      name: 'Features (Binary)',
      layers: useFeaturesLegend(),
    },
  ];
};
