/// <reference types="node" />

type AppParams = {
  mongoDbDatabase: string;
  mongoDbHost: string;
  mongoDbPort: string;
  mongoDbAuthUser: string;
  mongoDbAuthPassword: string;
};

declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | undefined;
  }

  export interface Process {
    env: ProcessEnv;
    appParams: AppParams;
  }
}
