// ClubOps - Error Handler Middleware
// Centralized error handling with logging

const errorHandler = (error, req, res, next) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    clubId: req.clubId,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Prisma errors
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'This record already exists'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Record not found',
      message: 'The requested record was not found'
    });
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.errors
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Please log in again'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please log in again'
    });
  }

  // Default error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack })
  });
};

module.exports = errorHandler;