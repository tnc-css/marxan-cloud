import React, { useState } from 'react';
import { Field as FieldRFF } from 'react-final-form';

import Field from 'components/forms/field';
import {
  composeValidators,
} from 'components/forms/validations';
import CountryRegionSelector from 'components/countries/country-region-selector';
import PlanningUnitGrid from 'components/projects/planning-unit-grid';
import PlanningUnitAreaSize from 'components/projects/planning-unit-area-size';
import { PlanningUnit, PlanningArea } from 'types/project-model';

import { PlanningAreaSelectorProps } from './types';

export const PlanningAreaSelector: React.FC<PlanningAreaSelectorProps> = ({
  area,
  onChange,
}: PlanningAreaSelectorProps) => {
  const [data, setData] = useState<PlanningArea>({
    size: 10,
    unit: PlanningUnit.HEXAGON,
    country: null,
    region: null,
  });
  const { size, unit } = data;

  console.info('area', area);

  return (
    <div>
      <CountryRegionSelector />
      <div className="flex">
        <FieldRFF
          name="planningUnitGridShape"
          validate={composeValidators([{ presence: true }])}
        >
          {(fprops) => (
            <Field id="planningUnitGridShape" {...fprops}>
              <PlanningUnitGrid
                unit={unit}
                onChange={(value) => {
                  const newData = {
                    ...data,
                    unit: value,
                  };
                  setData(newData);
                  fprops.input.onChange(value);
                  if (onChange) {
                    onChange(newData);
                  }
                }}
              />
            </Field>
          )}
        </FieldRFF>

        <PlanningUnitAreaSize
          size={size}
          onChange={(value) => {
            const newData = {
              ...data,
              size: value,
            };
            setData(newData);
            if (onChange) {
              onChange(newData);
            }
          }}
        />
      </div>
    </div>
  );
};

export default PlanningAreaSelector;
