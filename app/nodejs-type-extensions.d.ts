/// <reference types="node" />

type AppParams = {
  port: string | number;
  urlPrefix: string;
  isOnTestDatabase: boolean;
  color: boolean;
  searchModule: string;
  emailModule: string;
  digestInterval: number;
  digestImmediate: boolean;
  feedbackEmail: string;
  version: string;
  startTime: Date;
  nbPostsPerNewsfeedPage: number;
  nbTracksPerPlaylistEmbed: number;
  paths: {
    whydPath: string;
    uploadDirName: string;
    uAvatarImgDirName: string;
    uCoverImgDirName: string;
    uPlaylistDirName: string;
  };
};

declare namespace NodeJS {
  export interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | undefined;
    MONGODB_URL: string | undefined;
    WHYD_PORT: string | undefined;
    DEBUG: string | undefined;
  }

  export interface Process {
    env: ProcessEnv;
    appParams: AppParams;
    datadogTracer?: import('dd-trace').Tracer;
  }
}
