import type { Express } from 'express';

export interface AuthFeatures {
  injectExpressRoutes(app: Express, urlPrefix: string);
}
