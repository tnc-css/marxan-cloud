import React, { useCallback, useEffect, useMemo } from 'react';

import { Form as FormRFF } from 'react-final-form';
import { useSelector, useDispatch } from 'react-redux';

import { useRouter } from 'next/router';

import { useSaveScenarioPU } from 'hooks/scenarios';
import { useToasts } from 'hooks/toast';

import cx from 'classnames';
import { getScenarioSlice } from 'store/slices/scenarios/edit';

import Button from 'components/button';
import Icon from 'components/icon';

import SELECT_PLANNING_UNITS_SVG from 'svgs/ui/planning-units.svg?sprite';

export interface AnalysisAdjustClickingProps {
  type: string;
  selected: boolean;
  onSelected: (s: string) => void;
}

export const AnalysisAdjustClicking: React.FC<AnalysisAdjustClickingProps> = ({
  type,
  selected,
  onSelected,
}: AnalysisAdjustClickingProps) => {
  const { query } = useRouter();
  const { sid } = query;

  const { addToast } = useToasts();

  const scenarioSlice = getScenarioSlice(sid);
  const { setClicking, setClickingValue, setCache } = scenarioSlice.actions;
  const dispatch = useDispatch();
  const { clickingValue } = useSelector((state) => state[`/scenarios/${sid}/edit`]);

  const scenarioPUMutation = useSaveScenarioPU({});

  const INITIAL_VALUES = useMemo(() => {
    return {
      type,
      clickingValue,
    };
  }, [type, clickingValue]);

  // Effects
  useEffect(() => {
    if (selected) {
      dispatch(setClicking(true));
    }

    if (!selected) {
      dispatch(setClicking(false));
      dispatch(setClickingValue([]));
    }

    // Unmount
    return () => {
      dispatch(setClicking(false));
      dispatch(setClickingValue([]));
    };
  }, [selected]); // eslint-disable-line

  // Callbacks
  const onSubmit = useCallback((values) => {
    // Save current clicked pu ids
    scenarioPUMutation.mutate({
      id: `${sid}`,
      data: {
        byId: {
          [values.type]: values.clickingValue,
        },
      },
    }, {
      onSuccess: () => {
        onSelected(null);
        dispatch(setCache(Date.now()));
        dispatch(setClicking(false));
        dispatch(setClickingValue([]));

        addToast('adjust-planning-units-success', (
          <>
            <h2 className="font-medium">Success!</h2>
            <ul className="text-sm">
              <li>Planning units saved</li>
            </ul>
          </>
        ), {
          level: 'success',
        });
      },
      onError: () => {
        addToast('adjust-planning-units-error', (
          <>
            <h2 className="font-medium">Error!</h2>
            <ul className="text-sm">
              <li>Ooops! Something went wrong. Try again</li>
            </ul>
          </>
        ), {
          level: 'error',
        });
      },
    });
  }, [sid,
    scenarioPUMutation,
    onSelected,
    dispatch,
    setClicking,
    setClickingValue,
    setCache,
    addToast,
  ]);

  return (
    <FormRFF
      key="clicking-form"
      onSubmit={onSubmit}
      initialValues={INITIAL_VALUES}
    >
      {({ handleSubmit }) => (
        <form onSubmit={handleSubmit} autoComplete="off">
          <div
            key="clicking"
            role="presentation"
            className={cx({
              'text-sm py-2.5 focus:outline-none relative transition rounded-3xl px-10 cursor-pointer': true,
              'bg-gray-600 text-gray-200 opacity-50': !selected,
              'bg-gray-600 text-white': selected,
            })}
            onClick={() => onSelected('clicking')}
          >
            <header className="relative flex justify-between w-full">
              <div
                className={cx({
                  'text-center': !selected,
                  'text-left': selected,
                })}
              >
                Select planning units
              </div>

              {!selected && (
                <Icon
                  className="absolute right-0 w-5 h-5 transform -translate-y-1/2 top-1/2"
                  icon={SELECT_PLANNING_UNITS_SVG}
                />
              )}

              {selected && (
                <div className="flex items-center space-x-3 divide-x-2">
                  <Button
                    theme="secondary-alt"
                    size="s"
                    onClickCapture={() => {
                      onSelected(null);
                    }}
                  >
                    Cancel
                  </Button>

                  <Button
                    type="submit"
                    theme="primary"
                    size="s"
                  >
                    Save
                  </Button>
                  {/* <button
                    type="button"
                    className="flex items-center justify-center h-5 pl-5 pr-1 focus:outline-none"
                    onClickCapture={() => {
                      setSelected(null);
                    }}
                  >
                    <Icon
                      className="w-3 h-3 text-primary-500"
                      icon={ARROW_UP_SVG}
                    />
                  </button> */}
                </div>
              )}
            </header>

            {selected && (
              <div className="pt-2">
                <div className="flex w-full">
                  <p className="text-sm text-gray-300">Click over the map, and select planning units.</p>
                </div>
              </div>
            )}
          </div>
        </form>
      )}
    </FormRFF>
  );
};

export default AnalysisAdjustClicking;
