export function securityHeaders(req, res, next) {
    // Basic security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:;");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Special handling for favicon
    if (req.url === '/favicon.ico') {
      res.status(204).end();
      return;
    }
    
    next();
  }