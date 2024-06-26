import { FixtureType } from '@marxan/utils/tests/fixture-type';
import { getFixtures } from './scenario-cost-surface.fixtures';

let fixtures: FixtureType<typeof getFixtures>;

beforeEach(async () => {
  fixtures = await getFixtures();
  await fixtures.GivenScenarioWasCreated();
  await fixtures.GivenScenarioWithPuAndLocks();
});

describe(`As owner, when scenario has PUs with cost and lock status`, () => {
  it(`returns relevant data for pu.dat`, async () => {
    const result = await fixtures.WhenGettingMarxanDataAsOwner();
    const [headers, ...costAndStatus] = result.split('\n');

    expect(headers).toEqual('id\tcost\tstatus');
    expect(costAndStatus).toEqual(['0	200	0', '1	400	2', '2	600	3', '3	800	0']);
  });

  it(`returns relevant data for PU listing`, async () => {
    const results = await fixtures.WhenGettingPuInclusionStateAsOwner();
    expect(results).toEqual([
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'available',
        setByUser: false,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'locked-in',
        setByUser: true,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'locked-out',
        setByUser: true,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'available',
        setByUser: false,
      },
    ]);
  });
});

describe(`As contributor, when scenario has PUs with cost and lock status`, () => {
  it(`returns relevant data for pu.dat`, async () => {
    await fixtures.GivenContributorWasAddedToScenario();
    const result = await fixtures.WhenGettingMarxanDataAsContributor();
    const [headers, ...costAndStatus] = result.split('\n');

    expect(headers).toEqual('id\tcost\tstatus');
    expect(costAndStatus).toEqual(['0	200	0', '1	400	2', '2	600	3', '3	800	0']);
  });

  it(`returns relevant data for PU listing`, async () => {
    await fixtures.GivenContributorWasAddedToScenario();
    const results = await fixtures.WhenGettingPuInclusionStateAsContributor();
    expect(results).toEqual([
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'available',
        setByUser: false,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'locked-in',
        setByUser: true,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'locked-out',
        setByUser: true,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'available',
        setByUser: false,
      },
    ]);
  });
});

describe(`As viewer, when scenario has PUs with cost and lock status`, () => {
  it(`returns relevant data for pu.dat`, async () => {
    await fixtures.GivenViewerWasAddedToScenario();
    const result = await fixtures.WhenGettingMarxanDataAsViewer();
    const [headers, ...costAndStatus] = result.split('\n');

    expect(headers).toEqual('id\tcost\tstatus');
    expect(costAndStatus).toEqual(['0	200	0', '1	400	2', '2	600	3', '3	800	0']);
  });

  it(`returns relevant data for PU listing`, async () => {
    await fixtures.GivenViewerWasAddedToScenario();
    const results = await fixtures.WhenGettingPuInclusionStateAsViewer();
    expect(results).toEqual([
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'available',
        setByUser: false,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'locked-in',
        setByUser: true,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'locked-out',
        setByUser: true,
      },
      {
        defaultStatus: 'available',
        id: expect.any(String),
        inclusionStatus: 'available',
        setByUser: false,
      },
    ]);
  });
});

describe(`As user not in scenario, when scenario has PUs with cost and lock status`, () => {
  it(`returns forbidden when getting pu.dat`, async () => {
    const response = await fixtures.WhenGettingMarxanDataAsUserNotInScenario();
    await fixtures.ThenForbiddenIsReturned(response);
  });

  it(`returns forbidden when getting planning-units`, async () => {
    const response =
      await fixtures.WhenGettingPuInclusionStateAsUserNotInScenario();
    await fixtures.ThenForbiddenIsReturned(response);
  });
});
