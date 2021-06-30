import { PromiseType } from 'utility-types';
import { createWorld } from './world';

let world: PromiseType<ReturnType<typeof createWorld>>;

beforeEach(async () => {
  world = await createWorld();
});

afterEach(async () => {
  await world?.cleanup();
});

describe(`when getting spec.dat`, () => {
  it(`should resolve text/*`, async () => {
    expect((await world.WhenGettingSpecDat()).text).toMatchInlineSnapshot(`
      "id	prop	target	spf	name
      "
    `);
  });
});

describe(`when getting input.dat`, () => {
  it(`should resolve text/*`, async () => {
    expect((await world.WhenGettingInputDat()).text).toMatchInlineSnapshot(`
      "PROP 0.5
      COOLFAC 0
      NUMITNS 1000000
      NUMTEMP 10000
      RUNMODE 1
      HEURTYPE -1
      RANDSEED -1
      BESTSCORE 0
      CLUMPTYPE 0
      ITIMPTYPE 0
      MISSLEVEL 1
      STARTTEMP 1000000
      COSTTHRESH 0
      THRESHPEN1 0
      THRESHPEN2 0
      INPUTDIR input
      PUNAME pu.dat
      SPECNAME spec.dat
      PUVSPRNAME puvspr.dat
      BOUNDNAME bound.dat
      OUTPUTDIR output"
    `);
  });
});