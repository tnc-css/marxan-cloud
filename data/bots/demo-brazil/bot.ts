import {
  dirname,
  fromFileUrl,
  relative,
} from "https://deno.land/std@0.103.0/path/mod.ts";
import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.0/mod.ts";
import { createBot } from '../lib/libbot/init.ts';
import { SpecificationStatus} from '../lib/libbot/geo-feature-specifications.ts';
import { getDemoFeatureSpecificationFromFeatureNamesForProject } from './lib.ts';

const scriptPath = dirname(relative(Deno.cwd(), fromFileUrl(import.meta.url)));

const { API_URL, USERNAME, PASSWORD, POSTGRES_URL } = config({
  path: scriptPath + "/.env",
});

const settings = {
  apiUrl: API_URL,
  credentials: {
    username: USERNAME,
    password: PASSWORD,
  },
};

const bot = await createBot(settings);

const organization = await bot.organizations.create({
  name: '[demo] Brazil ' + crypto.randomUUID(),
  description: '',
});

const planningUnitAreakm2 = 50;

const planningAreaId = await bot.planningAreaUploader.uploadFromFile(`${scriptPath}/test_mata.zip`);

const project = await bot.projects.createInOrganization(organization.id, {
  name: 'Brazil ' + crypto.randomUUID(),
  description: '',
  planningAreaId: planningAreaId,
  planningUnitGridShape: 'hexagon',
  planningUnitAreakm2,
});

// We don't expose status of planning unit grid calculations yet so we cannot
// poll for completion of this task, but a reasonable, project-specific wait
// here will do when there is nothing else keeping the API and PostgreSQL busy.
await sleep(30);

// Scenario creation with the bare minimum; From there we need to be setting
// other traits via patch.
const scenario = await bot.scenarios.createInProject(project.id, {
    name: `Brazil - scenario 01`,
    type: "marxan",
    description: "Demo scenario",
    metadata: bot.metadata.analysisPreview(),
  });

// get the list of protected areas in the region and use all of them
const paCategories = await bot.protectedAreas.getIucnCategoriesForPlanningAreaWithId(planningAreaId);

await bot.scenarios.update(scenario.id, {
  wdpaIucnCategories: paCategories,
});

await bot.scenarios.update(scenario.id, {
  wdpaThreshold: 50,
  metadata: bot.metadata.analysisPreview(),
});

await bot.scenarioStatus.waitForPlanningAreaProtectedCalculationFor(project.id, scenario.id, 'short');

//Setup features in the project
const wantedFeatures = [
  // "demo_ecoregions_new_class_split",
  // "buteogallus_urubitinga",
  // "caluromys_philander",
  // "chiroxiphia_caudata",
  // "leopardus_pardalis",
  // "megarynchus_pitangua",
  // "phyllodytes_tuberculosus",
  // "priodontes_maximus",
  // "proceratophrys_bigibbosa",
  // "tapirus_terrestris",
  "thalurania_glaucopis",
];

const featuresForSpecification = await getDemoFeatureSpecificationFromFeatureNamesForProject(project.id, bot, wantedFeatures);

await bot.geoFeatureSpecifications.submitForScenario(scenario.id, featuresForSpecification, SpecificationStatus.created);

await bot.scenarioStatus.waitForFeatureSpecificationCalculationFor(project.id, scenario.id, 'short');

await bot.marxanExecutor.runForScenario(scenario.id);

await bot.scenarioStatus.waitForMarxanCalculationsFor(project.id, scenario.id, 'some');
