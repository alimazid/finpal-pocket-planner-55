import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface ApiErrorInterface extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  error: ApiErrorInterface | Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', error);

  // Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    });
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    switch ((error as any).code) {
      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Unique constraint violation',
          message: 'A record with this data already exists'
        });
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Record not found',
          message: 'The requested record was not found'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Database error',
          message: error.message
        });
    }
  }

  // Custom API errors
  if ('statusCode' in error && error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message || 'An error occurred'
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
}

export class ApiError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}