import { PlanningArea } from 'types/project-model';

export interface PlanningAreaSelectorProps {
  area: any;
  onChange?: (area: PlanningArea) => void;
}
