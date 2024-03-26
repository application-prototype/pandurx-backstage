//https://www.npmjs.com/package/winston-azure-application-insights?activeTab=code
import Transport, { TransportStreamOptions } from 'winston-transport';
import type { LogEntry } from "winston";
import { LogsIngestionClient } from "@azure/monitor-ingestion";
import { DefaultAzureCredential } from "@azure/identity";
import { Config } from '@backstage/config';

let _config: Config;
let  _client: LogsIngestionClient;
let  _ruleId: string;
let  _stream: string;
let  _logsIngestionEndpoint: string;
export class AzureTransport extends Transport {
  
  private _credential: DefaultAzureCredential;


  constructor(opts: TransportStreamOptions) 
  {
    super(opts);

    /*
     * Consume any custom options here. e.h:
     * Connection information for databases
     * Authentication information for APIs
     */

    this._credential = new DefaultAzureCredential();
    
    /* 
     * notes
     * yarn add winston-transport --ignore-workspace-root-check
     * yarn add @azure/monitor-ingestion --ignore-workspace-root-check
     * yarn add @types/node --ignore-workspace-root-check
     * 
     */

    // initialize the variables
    // this._logsIngestionEndpoint = 'logsIngestionEndpoint'
    // this._ruleId = 'ruleId'
    // this._stream = 'stream'
    // this._client = new LogsIngestionClient(this._logsIngestionEndpoint, this._credential);
  }

  setConfig(config: Config) {
    _config = config;
    const azureLoggingConfig = _config.getConfig('azure-logging');
    _logsIngestionEndpoint = azureLoggingConfig.getString('logsIngestionEndpoint');
    _ruleId = azureLoggingConfig.getString('ruleId');
    _stream = azureLoggingConfig.getString('stream');
    _client = new LogsIngestionClient(_logsIngestionEndpoint, this._credential);
  }


  // this functions run when something is logged so here's where you can add you custom logic to do stuff when something is logged.
  async log(info: LogEntry, callback: any) {
    // make sure you installed `@types/node` or this will give a typerror
    // this is the basic default behavior don't forget to add this.
    setImmediate(() => {
      this.emit("logged", info);
    });

    const { level, message, ...meta } = info;

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
      await _client.upload(_ruleId, _stream, logs);
    }
    catch(e) {
      console.log("caught exception while uploading to azure " + e);   
    }

    // don't forget this one
    callback();
  }
}