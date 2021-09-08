/// <reference types="node" />

declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | undefined;
  }

  type AppParams = {
    urlPrefix: string;
  };

  export interface Process {
    env: ProcessEnv;
    appParams: AppParams;
  }
}
