//https://www.npmjs.com/package/winston-azure-application-insights?activeTab=code
import Transport, { TransportStreamOptions } from 'winston-transport';
import type { LogEntry } from "winston";
import { LogsIngestionClient } from "@azure/monitor-ingestion";
import { DefaultAzureCredential } from "@azure/identity";

export class AzureTransport extends Transport {
  constructor(private _lorem: string, opts: TransportStreamOptions) 
  {
    super(opts);

    /*
     * Consume any custom options here. e.h:
     * Connection information for databases
     * Authentication information for APIs
     */
    
    console.log("pandurx ======> constructor " + this._lorem)

    /* 
     * notes
     * yarn add winston-transport --ignore-workspace-root-check
     * yarn add @azure/monitor-ingestion --ignore-workspace-root-check
     * yarn add @types/node --ignore-workspace-root-check
     * 
     */

  }

    // this functions run when something is logged so here's where you can add you custom logic to do stuff when something is logged.
  async log(info: LogEntry, callback: any) {
    // make sure you installed `@types/node` or this will give a typerror
    // this is the basic default behavior don't forget to add this.
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { level, message, ...meta } = info;

    const logsIngestionEndpoint = "https://pbackstagecollendpoint-sq3g.canadacentral-1.ingest.monitor.azure.com" || "logs_ingestion_endpoint";
    const ruleId = "dcr-cf0afeda30224cc7992258e17b671bb4" || "data_collection_rule_id";
    const streamName = "Custom-backstage_CL" || "data_stream_name";

    const credential = new DefaultAzureCredential();
    const client = new LogsIngestionClient(logsIngestionEndpoint, credential);

    const logs = [
      {
        b_level: info.level as string,
        b_service: info.service as string,
        b_message: info.message as string,
        b_plugin: info.plugin as string,
        b_type: info.type as string
      }
    ];

    console.log("loggging ====> " + JSON.stringify(info.session))
    // here you can add your custom logic, e.g. ingest data into database etc.
    console.log("pandurx ======> log info " + JSON.stringify(info))

    try {
      await client.upload(ruleId, streamName, logs);
    }
    catch(e) {
      console.log("caught exception while uploading to azure " + e);   
    }

    // don't forget this one
    callback();
  }
}