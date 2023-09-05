import type { Express } from 'express';

export interface AuthFeatures {
  injectExpressRoutes(app: Express, urlPrefix: string): void;
  sendPasswordChangeRequest(email: string): Promise<void>;
  setUsername(userId: string, username: string): Promise<void>;
  setUserEmail(userId: string, email: string): Promise<void>;
}
