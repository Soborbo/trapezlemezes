/**
 * API Response Helpers
 *
 * Standardized response creators to reduce duplication across API routes.
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Create a successful JSON response
 */
export function successResponse<T = unknown>(
  data?: T,
  message?: string,
  statusCode = 200
): Response {
  const body: ApiSuccessResponse<T> = { success: true };
  if (data !== undefined) body.data = data;
  if (message) body.message = message;

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
  error: string,
  statusCode = 500,
  errors?: Record<string, string>
): Response {
  const body: ApiErrorResponse = { success: false, error };
  if (errors) body.errors = errors;

  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create a validation error response (400)
 */
export function validationErrorResponse(
  errors: Record<string, string>,
  message = 'Érvénytelen adatok'
): Response {
  return errorResponse(message, 400, errors);
}

/**
 * Create a not found error response (404)
 */
export function notFoundResponse(message = 'A kért erőforrás nem található'): Response {
  return errorResponse(message, 404);
}

/**
 * Create an internal server error response (500)
 */
export function serverErrorResponse(
  message = 'Hiba történt a feldolgozás során. Kérjük, próbálja újra.'
): Response {
  return errorResponse(message, 500);
}
