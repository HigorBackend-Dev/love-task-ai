// Error messages in English for all authentication and application errors
export const ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  'Invalid login credentials': 'Invalid email or password. Please try again.',
  'Email not confirmed': 'Please confirm your email before logging in. Check your inbox for a confirmation link.',
  'User already registered': 'This email is already registered. Please sign in instead.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
  'Invalid email': 'Please enter a valid email address.',
  'Email already in use': 'This email is already registered. Please use a different email or sign in.',
  'Auth session missing': 'Your session has expired. Please log in again.',
  'User not found': 'User not found. Please check your email and try again.',
  'Too many requests': 'Too many login attempts. Please try again later.',
  'Invalid token': 'Your authentication token is invalid. Please log in again.',

  // Network errors
  'Failed to fetch': 'Network error. Please check your internet connection.',
  'ERR_CONNECTION_REFUSED': 'Cannot connect to the server. Please check if the server is running.',
  'timeout': 'Request timeout. Please try again.',
  'ENOTFOUND': 'Cannot reach the server. Please check your internet connection.',

  // Task errors
  'Failed to create task': 'Could not create task. Please try again.',
  'Failed to update task': 'Could not update task. Please try again.',
  'Failed to delete task': 'Could not delete task. Please try again.',
  'Task not found': 'Task not found. It may have been deleted.',
  'Failed to fetch tasks': 'Could not load tasks. Please try again.',
  'Failed to enhance task': 'Could not enhance task. The enhancement service is temporarily unavailable.',

  // Chat errors
  'Failed to create chat session': 'Could not create chat session. Please try again.',
  'Failed to send message': 'Could not send message. Please try again.',
  'Failed to fetch messages': 'Could not load messages. Please try again.',

  // Validation errors
  'Email is required': 'Please enter an email address.',
  'Password is required': 'Please enter a password.',
  'Passwords do not match': 'Passwords do not match. Please try again.',
  'Please confirm your password': 'Please confirm your password.',

  // Server errors
  'Internal server error': 'Server error. Please try again later.',
  'Service unavailable': 'Service is temporarily unavailable. Please try again later.',
  'Unauthorized': 'You do not have permission to perform this action.',
  'Forbidden': 'Access denied.',
  'Not found': 'Resource not found.',

  // Generic errors
  'Unknown error': 'An unexpected error occurred. Please try again.',
  'Error': 'Something went wrong. Please try again.',
};

export function getErrorMessage(error: unknown): string {
  // Handle string errors
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message;
    
    // Check if message matches any known error
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(key)) {
        return value;
      }
    }

    // If no match, return the original message or generic error
    return message || ERROR_MESSAGES['Unknown error'];
  }

  // Handle objects with error property
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if ('message' in errorObj) {
      return getErrorMessage(errorObj.message);
    }
    if ('error' in errorObj) {
      return getErrorMessage(errorObj.error);
    }
  }

  return ERROR_MESSAGES['Unknown error'];
}

export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('invalid') ||
    message.includes('email') ||
    message.includes('password') ||
    message.includes('unauthorized') ||
    message.includes('session') ||
    message.includes('token')
  );
}

export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    message.includes('enotfound')
  );
}

export function isValidationError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes('required') ||
    message.includes('invalid') ||
    message.includes('match') ||
    message.includes('confirm')
  );
}
