import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import {LoggerService} from '@backstage/backend-plugin-api';

import { DefaultAzureCredential } from "@azure/identity";
import { LogsIngestionClient } from "@azure/monitor-ingestion";
import * as dotenv from "dotenv";
import { DateTime } from 'luxon';

export interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  
  const { logger } = options;

  const router = Router();
  router.use(express.json());

  router.get('/health', (_, response) => {
    logger.info('HELLO WORLD!!');
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });


  // testing logging to azure

  router.post('/test', (req, res) => {
    console.log("pandurx post ====> " + JSON.stringify(req.params));
  });
  router.get('/test', async (_, response) => {

    // testing ingestion...
    const { LogsIngestionClient } = require("@azure/monitor-ingestion");

    require("dotenv").config();

    const logsIngestionEndpoint = "https://pbackstagecollendpoint-sq3g.canadacentral-1.ingest.monitor.azure.com" || "logs_ingestion_endpoint";
    //const ruleId = "/subscriptions/30462eb8-8ad3-474b-964c-af41124f9ad0/resourceGroups/PANDURX-RG/providers/Microsoft.Insights/dataCollectionRules/pbackstagecollrule" || "data_collection_rule_id";
    const ruleId = "dcr-db44129dc8d64f9d8400a279fffa2e3e" || "data_collection_rule_id";
    const streamName = "Custom-pbackstagelog_CL" || "data_stream_name";

    const credential = new DefaultAzureCredential();

    console.log(credential);

    const client = new LogsIngestionClient(logsIngestionEndpoint, credential);
    const logs = [
      {
        author: "pandurx-plugin",
        log_app: "pbackstage",
        log_timestamp: "2021-12-08T23:51:14.1104269Z",
      }
    ];

    try{
      var result = await client.upload(ruleId, streamName, logs);
      console.log("pandurx =====> sending..." + result);   
    }
    catch(e){
      console.log("pandurx =====> error!" + e);   
    }
    finally {
      console.log("pandurx =====> success!!");   
    }

    response.json({resp: 'captured'});
  });

  router.use(errorHandler());
  return router;
}


/*
 * notes
 * reference: https://backstage.io/docs/plugins/backend-plugin/
 * run the following in order:
 * - Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
 * - yarn new                                                                     ==> creates a custom plugin (follow the steps in console)
 * - yarn --cwd packages/backend add @internal/plugin-helloworld1-backend@0.1.0   ==> this adds to node_modules (can be skipped...)
 * - curl http://localhost:7007/api/helloworld1/health (http://.../hello1/health) ==> pings the plugin (as defined in this router file)
 */