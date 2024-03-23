import { createRouter } from '@internal/plugin-helloworld1-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

import { DefaultIdentityClient, ProfileInfo } from "@backstage/plugin-auth-node";
import { DefaultAzureCredential } from "@azure/identity";
import { LogsIngestionClient } from "@azure/monitor-ingestion";
import * as dotenv from "dotenv";
import { DateTime } from 'luxon';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  // Here is where you will add all of the required initialization code that
  // your backend plugin needs to be able to start!

  // The env contains a lot of goodies, but our router currently only
  // needs a logger

  return await createRouter({
    logger: env.logger
  });
}
