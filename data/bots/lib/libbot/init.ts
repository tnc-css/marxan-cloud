import { config } from "https://deno.land/x/dotenv@v2.0.0/mod.ts";
import {
  dirname,
  fromFileUrl,
  relative,
} from "https://deno.land/std@0.103.0/path/mod.ts";
import { BotHttpClient, MarxanBotConfig } from './marxan-bot.ts';
import { Organizations } from './organizations.ts';
import { Projects } from './projects.ts';
import { Scenarios } from './scenarios.ts';

const scriptPath = dirname(relative(Deno.cwd(), fromFileUrl(import.meta.url)));

export const createBot = async (botConfig?: MarxanBotConfig) => {
  const { API_URL, USERNAME, PASSWORD, POSTGRES_URL } = config({
    path: scriptPath + "/.env",
  });
  
  const httpClient = await BotHttpClient.init({
    apiUrl: API_URL,
    credentials: {
      username: USERNAME,
      password: PASSWORD,
    }
  });

  const organizations = new Organizations(httpClient);
  const projects = new Projects(httpClient);
  const scenarios = new Scenarios(httpClient);

  return {
    organizations,
    projects,
    scenarios,
  }
}