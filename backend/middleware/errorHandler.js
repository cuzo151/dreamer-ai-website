const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Default error status and message
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  switch (err.name) {
  case 'ValidationError': {
    status = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
  
  break;
  }
  case 'UnauthorizedError': {
    status = 401;
    message = 'Unauthorized';
    code = 'UNAUTHORIZED';
  
  break;
  }
  case 'CastError': {
    status = 400;
    message = 'Invalid ID format';
    code = 'INVALID_ID';
  
  break;
  }
  default: if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service Unavailable';
    code = 'SERVICE_UNAVAILABLE';
  }
  }

  // Send error response
  res.status(status).json({
    error: {
      message,
      code,
      ...(process.env.NODE_ENV === 'development' && {
        details: err.message,
        stack: err.stack
      })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

module.exports = { errorHandler };