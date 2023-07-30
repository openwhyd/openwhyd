/// <reference types="node" />

type AppParams = {
  mongoDbDatabase: string;
  mongoDbHost: string;
  mongoDbPort: string;
  mongoDbAuthUser: string;
  mongoDbAuthPassword: string;
  port: string | number;
  urlPrefix: string;
  color: boolean;
  genuineSignupSecret: string;
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
  }

  export interface Process {
    env: ProcessEnv;
    appParams: AppParams;
  }
}
