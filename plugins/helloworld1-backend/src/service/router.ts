import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { LoggerService } from '@backstage/backend-plugin-api';
import { DefaultIdentityClient, ProfileInfo } from "@backstage/plugin-auth-node";
import { DefaultAzureCredential } from "@azure/identity";
import { LogsIngestionClient } from "@azure/monitor-ingestion";

export interface RouterOptions {
  logger: LoggerService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger } = options;
  const router = Router();
  router.use(express.json());

  // testing logging to azure
  router.post('/test', async (req, res) => {
    /*
    * notes
    * reference: https://backstage.io/docs/plugins/backend-plugin/
    * run the following in order:
    * - Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    * - yarn new                                                                     ==> creates a custom plugin (follow the steps in console)
    * - yarn --cwd packages/backend add @internal/plugin-helloworld1-backend@0.1.0   ==> this adds to node_modules (can be skipped...)
    * - curl http://localhost:7007/api/helloworld1/health (http://.../hello1/health) ==> pings the plugin (as defined in this router file)
    * 
    * - to add and install packages:  yarn add @azure/monitor-ingestion --ignore-workspace-root-check
    */

    const logsIngestionEndpoint = "https://pbackstagecollendpoint-sq3g.canadacentral-1.ingest.monitor.azure.com" || "logs_ingestion_endpoint";
    const ruleId = "dcr-cf0afeda30224cc7992258e17b671bb4" || "data_collection_rule_id";
    const streamName = "Custom-backstage_CL" || "data_stream_name";

    const credential = new DefaultAzureCredential();
    const client = new LogsIngestionClient(logsIngestionEndpoint, credential);

    const logs = [
      {
        b_level: req.body.level as string,
        b_service: req.body.service as string,
        b_message: req.body.message as string,
        b_plugin: req.body.plugin as string,
        b_type: req.body.type as string
      }
    ];


    try {
      await client.upload(ruleId, streamName, logs);
    }
    catch(e){
      logger.error("caught exception " + e);   
    }

    res.json({resp: 'captured'});
  });

  router.use(errorHandler());
  return router;
}


