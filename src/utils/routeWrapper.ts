import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AuthenticatedRequest } from '../types/database';

// Wrapper pour convertir les contrôleurs avec AuthenticatedRequest en RequestHandler compatible
export const wrapController = (controller: (req: AuthenticatedRequest, res: Response, next?: NextFunction) => Promise<void>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    controller(req as unknown as AuthenticatedRequest, res, next);
  };
};

// Wrapper pour les contrôleurs qui n'ont pas besoin de next
export const wrapControllerSimple = (controller: (req: AuthenticatedRequest, res: Response) => Promise<void>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    controller(req as unknown as AuthenticatedRequest, res).catch(next);
  };
};
