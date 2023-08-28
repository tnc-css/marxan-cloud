import { useMutation, useQuery, QueryObserverOptions } from 'react-query';

import { AxiosRequestConfig } from 'axios';
import { useSession } from 'next-auth/react';

import { Project } from 'types/api/project';
import { Scenario } from 'types/api/scenario';
import { WDPA, WDPACategory } from 'types/api/wdpa';

import { API } from 'services/api';
import SCENARIOS from 'services/scenarios';

export function useWDPACategories({
  adminAreaId,
  customAreaId,
  scenarioId,
}: {
  adminAreaId?: WDPA['id'];
  customAreaId?: WDPA['id'];
  scenarioId: Scenario['id'];
}) {
  const { data: session } = useSession();

  return useQuery(
    ['protected-areas', adminAreaId, customAreaId],
    async () =>
      API.request<WDPACategory[]>({
        method: 'GET',
        url: `/scenarios/${scenarioId}/protected-areas`,
        params: {
          ...(adminAreaId && {
            'filter[adminAreaId]': adminAreaId,
          }),
          ...(customAreaId && {
            'filter[customAreaId]': customAreaId,
          }),
        },
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }).then(({ data }) => data),
    {
      enabled: !!adminAreaId || !!customAreaId,
      select: ({ data }) => data,
    }
  );
}

export function useSaveScenarioProtectedAreas({
  requestConfig = {
    method: 'POST',
  },
}: {
  requestConfig?: AxiosRequestConfig;
}) {
  const { data: session } = useSession();

  const saveScenarioProtectedAreas = ({
    id,
    data,
  }: {
    id: Scenario['id'];
    data: {
      areas: {
        id: string;
        selected: boolean;
      }[];
      threshold: number;
    };
  }) => {
    return SCENARIOS.request({
      url: `/${id}/protected-areas`,
      data,
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
      ...requestConfig,
    });
  };

  return useMutation(saveScenarioProtectedAreas);
}

export function useProjectWDPAs<T = WDPA[]>(
  pid: Project['id'],
  params: { sort?: string } = {},
  queryOptions: QueryObserverOptions<WDPA[], Error, T> = {}
) {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['protected-areas', pid],
    queryFn: async () =>
      API.request<WDPA[]>({
        method: 'GET',
        url: `/projects/${pid}/protected-areas`,
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        params,
      }).then(({ data }) => data),
    enabled: Boolean(pid),
    ...queryOptions,
  });
}
