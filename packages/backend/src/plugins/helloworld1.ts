import { createRouter } from '@internal/plugin-helloworld1-backend';
import { Router } from 'express';
import { PluginEnvironment } from '../types';

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
  
  console.log("pandurx --------------------> helloworld1 plugin initializing...")

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
      author: "pandurx-startup",
      log_app: "pbackstage",
      log_timestamp: "2021-12-08T23:51:14.1104269Z",
    }
  ];
  try{
    await client.upload(ruleId, streamName, logs);
  }
  catch(e){
    console.log(e);
  }


  return await createRouter({
    logger: env.logger
  });
}

