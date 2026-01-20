/// <reference types="node" />

type AppParams = {
  port: string | number;
  urlPrefix: string;
  isOnTestDatabase: boolean;
  color: boolean;
  useAuth0AsIdentityProvider: boolean;
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

// Extended HTTP interfaces for Openwhyd
declare module 'http' {
  interface IncomingMessage {
    // Session and body properties (added by Express middleware)
    session?: {
      whydUid?: string;
      [key: string]: unknown;
    };
    body?: Record<string, unknown>;
    files?: Record<string, unknown>;

    // Logging methods
    logToConsole(suffix?: string, params?: Record<string, unknown>): void;
    getReferer(): string | undefined;

    // Cookie methods
    getCookies(): Record<string, string> | null;
    getFacebookCookie(): Record<string, unknown> | null;

    // User authentication methods
    getUid(): string | undefined;
    getUser(): Promise<{
      _id: string | number;
      id: string;
      name: string;
      email?: string;
      img?: string;
      isAdmin?: boolean;
    } | null>;

    // Login and authorization methods
    checkLogin(
      response?: ServerResponse,
      format?: 'json' | string,
    ): Promise<
      | false
      | {
          id: string;
          name: string;
          email?: string;
          img?: string;
          isAdmin?: boolean;
        }
    >;
    isUserAdmin(user: { email?: string }): boolean;
    isAdmin(): Promise<boolean>;
    checkAdmin(
      response?: ServerResponse,
      format?: 'json' | string,
    ): Promise<
      | false
      | {
          id: string;
          name: string;
          email?: string;
          img?: string;
          isAdmin?: boolean;
        }
    >;
  }

  interface ServerResponse {
    // Legacy render method
    legacyRender(
      view: unknown,
      data?: unknown,
      headers?: Record<string, string>,
      statusCode?: number,
    ): void;

    // HTML and JSON rendering
    renderHTML(html: string, statusCode?: number): void;
    renderJSON(json: unknown, statusCode?: number): void;
    renderWrappedJSON(json: unknown, statusCode?: number): void;
    renderText(text: string, statusCode?: number): void;

    // Redirection methods
    redirect(url: string): void;
    safeRedirect(url: string): void;
    redirectWithTracking(url: string, title?: string): void;
    renderIframe(url: string, metaOverrides?: Record<string, unknown>): void;
    temporaryRedirect(url: string, reqParams?: Record<string, unknown>): void;

    // Error response methods
    badRequest(error?: unknown): void;
    forbidden(error?: unknown): void;
    notFound(): void;
  }
}
