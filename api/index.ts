/**
 * Vercel Serverless Function Handler
 * Gère les requêtes HTTP entrantes
 */

import type { IncomingMessage, ServerResponse } from 'http';
import app from '../src/server';

/**
 * Handler principal pour Vercel
 */
export default (req: IncomingMessage, res: ServerResponse) => {
  return app(req, res);
};
