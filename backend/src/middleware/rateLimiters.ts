import { Request, Response, NextFunction } from 'express';

export const generalLimiter = (req: Request, res: Response, next: NextFunction) => next();
export const authLimiter = (req: Request, res: Response, next: NextFunction) => next();
export const writeLimiter = (req: Request, res: Response, next: NextFunction) => next();
