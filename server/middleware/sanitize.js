// Custom sanitization middleware to replace express-mongo-sanitize and xss-clean
export const sanitizeData = (req, res, next) => {
  // Sanitize req.body
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        // Remove potential MongoDB operators
        req.body[key] = req.body[key].replace(/\$[a-zA-Z0-9]*/g, '');
        
        // Basic XSS protection
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '');
      }
    }
  }

  // Sanitize req.query
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].replace(/\$[a-zA-Z0-9]*/g, '');
      }
    }
  }

  // Sanitize req.params
  if (req.params) {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key].replace(/\$[a-zA-Z0-9]*/g, '');
      }
    }
  }

  next();
};