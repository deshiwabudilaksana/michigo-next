// Test import in the same location as the problematic file
import UserController from '@/lib/controllers/UserController';
import { validateUserRegistration, validateUserLogin } from '@/lib/middleware/validation';
import { ApiError, handleApiError } from '@/lib/utils/errorHandler';
import { authenticateUser, AuthenticatedRequest } from '@/lib/middleware/auth';

console.log('Import successful from same directory as users/index.ts');