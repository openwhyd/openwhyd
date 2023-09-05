import type { Express, Request } from 'express';

export type OpenwhydUser = {
  id: string;
  name: string;
  email: string;
  img: string;
};

export interface AuthFeatures {
  injectExpressRoutes(app: Express, urlPrefix: string): void;
  getAuthenticatedUser(request: Request): OpenwhydUser;
  sendPasswordChangeRequest(email: string): Promise<void>;
  setUserHandle(userId: string, username: string): Promise<void>;
  setUserEmail(userId: string, email: string): Promise<void>;
  setUserFullName(userId: string, email: string): Promise<void>;
}
