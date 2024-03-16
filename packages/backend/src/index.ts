/*
 * Hi!
 *
 * Note that this is an EXAMPLE Backstage backend. Please check the README.
 *
 * Happy hacking!
 */

// https://github.com/backstage/backstage/issues/22782
// WinstonLogger.create() will be used instead of createRootLogger()
import {
  WinstonLogger,WinstonLoggerOptions,
  HostDiscovery
} from '@backstage/backend-app-api';

// import custom plugin
import helloworld1 from './plugins/helloworld1'; 

import { transports, format } from 'winston';
import Router from 'express-promise-router';
import {
  createServiceBuilder,
  loadBackendConfig,
  useHotMemoize,
  notFoundHandler,
  CacheManager,
  DatabaseManager,
  UrlReaders,
  ServerTokenManager
} from '@backstage/backend-common';

import { TaskScheduler } from '@backstage/backend-tasks';
import { Config } from '@backstage/config';
import app from './plugins/app';
import auth from './plugins/auth';
import catalog from './plugins/catalog';
import scaffolder from './plugins/scaffolder';
import proxy from './plugins/proxy';
import techdocs from './plugins/techdocs';
import search from './plugins/search';
import { PluginEnvironment } from './types';
import { ServerPermissionClient } from '@backstage/plugin-permission-node';
import { DefaultIdentityClient, ProfileInfo } from '@backstage/plugin-auth-node';

function makeCreateEnv(config: Config, logger1: WinstonLogger) {
  const root = logger1;

  console.log("pandurx ================> use logger:" + JSON.stringify(root))

  const reader = UrlReaders.default({ logger: root, config });
  const discovery = HostDiscovery.fromConfig(config);
  const cacheManager = CacheManager.fromConfig(config);
  const databaseManager = DatabaseManager.fromConfig(config, { logger: root });
  const tokenManager = ServerTokenManager.noop();
  const taskScheduler = TaskScheduler.fromConfig(config, { databaseManager });

  const identity = DefaultIdentityClient.create({
    discovery,
  });
  const permissions = ServerPermissionClient.fromConfig(config, {
    discovery,
    tokenManager,
  });

  root.info(`Created UrlReader ${reader}`);

  return (plugin: string): PluginEnvironment => {
    const logger = root.child({ type: 'plugin', plugin });
    const database = databaseManager.forPlugin(plugin);
    const cache = cacheManager.forPlugin(plugin);
    const scheduler = taskScheduler.forPlugin(plugin);

    return {
      logger,
      database,
      cache,
      config,
      reader,
      discovery,
      tokenManager,
      scheduler,
      permissions,
      //identity
      //profile
    };
  };
}

async function main() {

  // transport - to external file
  // const outputToFile = new transports.File({
  //   filename: 'test-logging-file.log',
  //   maxFiles: 14,
  // });

  // @TODO transport - to azure log analytics
  // source
  // | extend TimeGenerated = todatetime(<time-column>)
  const outputToHttp = new transports.Http({
    ssl: false,
    //host: 'https://pbackstagecollendpoint-sq3g.canadacentral-1.ingest.monitor.azure.com',
    host: 'localhost',
    port: 7007,
    // auth?: { username?: string | undefined, password?: string | undefined, bearer?: string | undefined };
    path: '/api/hello1/test',
    // agent?: Agent | null;
  });

  // logger options here
  const wlo: WinstonLoggerOptions = {
    meta: {
      service: 'pandurx-backstage'
    },
    format: format.json(),
    level:  'debug',
    //level: 'debug',
    transports: [
      //outputToFile,
      //transports.Console,
      outputToHttp
    ]
  };

  const logger1 = WinstonLogger.create(wlo);
  
  console.log("pandurx ================> create WinstonLogger")

  const config = await loadBackendConfig({
    argv: process.argv,
    logger :  logger1
  });
  const createEnv = makeCreateEnv(config, logger1);

  const catalogEnv = useHotMemoize(module, () => createEnv('catalog'));
  const scaffolderEnv = useHotMemoize(module, () => createEnv('scaffolder'));
  const authEnv = useHotMemoize(module, () => createEnv('auth'));
  const proxyEnv = useHotMemoize(module, () => createEnv('proxy'));
  const techdocsEnv = useHotMemoize(module, () => createEnv('techdocs'));
  const searchEnv = useHotMemoize(module, () => createEnv('search'));
  const appEnv = useHotMemoize(module, () => createEnv('app'));

  // custom plugin env
  const hello1Env = useHotMemoize(module, () => createEnv('hello1'));

  const apiRouter = Router();
  apiRouter.use('/catalog', await catalog(catalogEnv));
  apiRouter.use('/scaffolder', await scaffolder(scaffolderEnv));
  apiRouter.use('/auth', await auth(authEnv));
  apiRouter.use('/techdocs', await techdocs(techdocsEnv));
  apiRouter.use('/proxy', await proxy(proxyEnv));
  apiRouter.use('/search', await search(searchEnv));

  // custom plugin
  apiRouter.use('/hello1', await helloworld1(hello1Env));

  // Add backends ABOVE this line; this 404 handler is the catch-all fallback
  apiRouter.use(notFoundHandler());

  const service = createServiceBuilder(module)
    .loadConfig(config)
    .addRouter('/api', apiRouter)
    .addRouter('', await app(appEnv));

  await service.start().catch(err => {
    console.log(err);
    process.exit(1);
  });
}

module.hot?.accept();
main().catch(error => {
  console.error('Backend failed to start up', error);
  process.exit(1);
});
