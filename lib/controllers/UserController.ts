import { Request, Response } from 'express';
import { User } from '../models/User';
import * as jwt from 'jsonwebtoken';
import config from '../config/config';
import { ApiError } from '../utils/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';

class UserController {
  // Register a new user - by default they get 'attendee' role
  async registerUser(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, requestOrganizerAccess } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new ApiError('User already exists', 400);
      }

      // Create new user with default attendee role
      const roles = requestOrganizerAccess ? ['attendee', 'organizer'] : ['attendee'];
      
      const user = new User({
        email,
        password,
        firstName,
        lastName,
        roles, // Add roles to the user
        isVerified: false, // New users start as unverified
      });

      await user.save();

      // Generate JWT token
      if (!config.jwt.secret) {
        throw new ApiError('JWT secret is not configured', 500);
      }

      // @ts-ignore
      const token = jwt.sign(
        { userId: user._id.toString() },
        config.jwt.secret,
        {
          expiresIn: config.jwt.expiresIn,
        }
      );

      return {
        message: requestOrganizerAccess 
          ? 'User registered successfully. Organizer access requested and pending approval.' 
          : 'User registered successfully',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Update user roles (admin route)
  async updateUserRoles(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params?.userId;
      if (!userId) {
        throw new ApiError('User ID is required', 400);
      }
      
      const { roles } = req.body; // Array of roles to assign

      const user = await User.findById(userId);
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      // Validate that all roles are valid
      const validRoles = ['attendee', 'organizer', 'admin'];
      const invalidRoles = roles.filter((role: string) => !validRoles.includes(role));
      
      if (invalidRoles.length > 0) {
        throw new ApiError(`Invalid roles: ${invalidRoles.join(', ')}`, 400);
      }

      user.roles = roles;
      await user.save();

      return {
        message: 'User roles updated successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw new ApiError('Invalid credentials', 400);
      }

      // Check password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new ApiError('Invalid credentials', 400);
      }

      // Generate JWT token
      if (!config.jwt.secret) {
        throw new ApiError('JWT secret is not configured', 500);
      }

      // @ts-ignore
      const token = jwt.sign(
        { userId: user._id.toString() },
        config.jwt.secret,
        {
          expiresIn: config.jwt.expiresIn,
        }
      );

      return {
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roles: user.roles, // Include roles in response
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get current user profile
  async getUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
      // The user is already attached to the request via authenticateUser middleware
      const user = await User.findById(req.userId).select('-password');

      if (!user) {
        throw new ApiError('User not found', 404);
      }

      return user;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserController();