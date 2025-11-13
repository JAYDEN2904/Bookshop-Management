import { Request, Response, NextFunction } from 'express';

/**
 * Request timeout middleware
 * Prevents requests from hanging indefinitely
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set timeout for the request
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: 'Request timeout. The server took too long to respond.',
          message: 'Please try again. If the problem persists, the server may be starting up.'
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalEnd = res.end.bind(res);
    res.end = function(chunk?: any, encoding?: any, cb?: any): Response {
      clearTimeout(timeout);
      return originalEnd(chunk, encoding, cb);
    };

    next();
  };
};

