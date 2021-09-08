declare namespace NodeJS {
  type TypedEnvVars = {
    NODE_ENV: 'development' | 'production' | undefined;
  };

  type AppParams = {
    urlPrefix: string;
  };

  export interface Process {
    env: TypedEnvVars;
    appParams: AppParams;
  }
}
