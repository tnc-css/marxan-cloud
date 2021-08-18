import React, {
  useCallback, useEffect, useState,
} from 'react';

// Map
import { useSelector, useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { getScenarioSlice } from 'store/slices/scenarios/detail';

import PluginMapboxGl from '@vizzuality/layer-manager-plugin-mapboxgl';
import { LayerManager, Layer } from '@vizzuality/layer-manager-react';
import { useSession } from 'next-auth/client';

import {
  usePUGridLayer, useLegend,
} from 'hooks/map';
import { useProject } from 'hooks/projects';
import { useScenario, useScenarioPU } from 'hooks/scenarios';
import { useBestSolution } from 'hooks/solutions';

import Map from 'components/map';
// Controls
import Controls from 'components/map/controls';
import FitBoundsControl from 'components/map/controls/fit-bounds';
import ZoomControl from 'components/map/controls/zoom';
import Legend from 'components/map/legend';
import LegendItem from 'components/map/legend/item';
import LegendTypeBasic from 'components/map/legend/types/basic';
import LegendTypeChoropleth from 'components/map/legend/types/choropleth';
import LegendTypeGradient from 'components/map/legend/types/gradient';
import LegendTypeMatrix from 'components/map/legend/types/matrix';

export interface ScenariosShowMapProps {
}

export const ScenariosMap: React.FC<ScenariosShowMapProps> = () => {
  const [open, setOpen] = useState(true);
  const [shownMap, setshownMap] = useState(true);
  const [session] = useSession();

  const dispatch = useDispatch();

  const { query } = useRouter();
  const { pid, sid } = query;

  const { data = {} } = useProject(pid);
  const { bbox } = data;

  const { data: scenarioData } = useScenario(sid);

  const { data: PUData } = useScenarioPU(sid);

  const { included, excluded } = PUData || {};

  const { wdpaIucnCategories, wdpaThreshold } = scenarioData || {};

  const {
    data: bestSolutionData,
  } = useBestSolution(sid);

  const bestSolution = bestSolutionData || {};

  const scenarioSlice = getScenarioSlice(sid);
  const { setLayerSettings } = scenarioSlice.actions;

  const {
    tab,
    subtab,
    selectedSolution,
    layerSettings,
  } = useSelector((state) => state[`/scenarios/${sid}`]);

  const minZoom = 2;
  const maxZoom = 20;
  const [viewport, setViewport] = useState({});
  const [bounds, setBounds] = useState(null);

  const PUGridLayer = usePUGridLayer({
    active: true,
    sid: sid ? `${sid}` : null,
    type: tab,
    subtype: subtab,
    options: {
      wdpaIucnCategories,
      wdpaThreshold,
      puIncludedValue: included,
      puExcludedValue: excluded,
      runId: selectedSolution?.runId || bestSolution?.runId,
      settings: {
        pugrid: layerSettings.pugrid,
        'wdpa-percentage': layerSettings['wdpa-percentage'],
        cost: layerSettings.cost,
        'lock-in': layerSettings['lock-in'],
        'lock-out': layerSettings['lock-out'],
        frequency: layerSettings.frequency,
        solution: layerSettings.solution,
      },
    },
  });

  const LAYERS = [PUGridLayer].filter((l) => !!l);

  const LEGEND = useLegend({
    type: tab,
    subtype: subtab,
    options: {
      wdpaIucnCategories,
      wdpaThreshold,
      puIncludedValue: included,
      puExcludedValue: excluded,
      runId: selectedSolution?.runId || bestSolution?.runId,
      layerSettings,
    },
  });

  useEffect(() => {
    setBounds({
      bbox,
      options: { padding: 50 },
      viewportOptions: { transitionDuration: 0 },
    });
  }, [bbox]);

  const handleViewportChange = useCallback((vw) => {
    setViewport(vw);
  }, []);

  const handleZoomChange = useCallback(
    (zoom) => {
      setViewport({
        ...viewport,
        zoom,
        transitionDuration: 500,
      });
    },
    [viewport],
  );

  const handleFitBoundsChange = useCallback((b) => {
    setBounds(b);
  }, []);

  const handleClick = useCallback((e) => {
    if (e && e.features) console.info(e.features);
  }, []);

  const handleTransformRequest = (url) => {
    if (url.startsWith(process.env.NEXT_PUBLIC_API_URL)) {
      return {
        url,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      };
    }

    return null;
  };

  const onChangeOpacity = useCallback((opacity, id) => {
    dispatch(setLayerSettings({
      id,
      settings: { opacity },
    }));
  }, [setLayerSettings, dispatch]);

  const onChangeVisibility = useCallback((id) => {
    setshownMap(!shownMap);
    dispatch(setLayerSettings({
      id,
      settings: { visibility: shownMap },
    }));
  }, [setLayerSettings, dispatch, shownMap]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-4xl">
      <Map
        bounds={bounds}
        width="100%"
        height="100%"
        minZoom={minZoom}
        maxZoom={maxZoom}
        viewport={viewport}
        mapboxApiAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN}
        mapStyle="mapbox://styles/marxan/ckn4fr7d71qg817kgd9vuom4s"
        onMapViewportChange={handleViewportChange}
        onClick={handleClick}
        transformRequest={handleTransformRequest}
      >
        {(map) => {
          return (
            <>
              <LayerManager map={map} plugin={PluginMapboxGl}>
                {LAYERS.map((l) => (
                  <Layer key={l.id} {...l} />
                ))}
              </LayerManager>
            </>
          );
        }}
      </Map>

      {/* Controls */}
      <Controls>
        <ZoomControl
          viewport={{
            ...viewport,
            minZoom,
            maxZoom,
          }}
          onZoomChange={handleZoomChange}
        />

        <FitBoundsControl
          bounds={{
            ...bounds,
            viewportOptions: {
              transitionDuration: 1500,
            },
          }}
          onFitBoundsChange={handleFitBoundsChange}
        />
      </Controls>
      {/* Legend */}
      <div className="absolute w-full max-w-xs bottom-10 right-2">
        <Legend
          open={open}
          className="w-full"
          maxHeight={300}
          onChangeOpen={() => setOpen(!open)}
        >
          {LEGEND.map((i) => {
            const {
              type, items, intersections, id,
            } = i;

            return (
              <LegendItem
                sortable={false}
                key={i.id}
                settingsManager={i.settingsManager}
                onChangeOpacity={(opacity) => onChangeOpacity(opacity, id)}
                onChangeVisibility={() => onChangeVisibility(id)}
                {...i}
              >
                {type === 'matrix' && <LegendTypeMatrix className="pt-6 pb-4 text-sm text-white" intersections={intersections} items={items} />}
                {type === 'basic' && <LegendTypeBasic className="text-sm text-gray-300" items={items} />}
                {type === 'choropleth' && <LegendTypeChoropleth className="text-sm text-gray-300" items={items} />}
                {type === 'gradient' && <LegendTypeGradient className={{ box: 'text-sm text-gray-300' }} items={items} />}
              </LegendItem>
            );
          })}
        </Legend>
      </div>

    </div>
  );
};

export default ScenariosMap;
