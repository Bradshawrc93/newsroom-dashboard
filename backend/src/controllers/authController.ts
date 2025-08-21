import { Request, Response, NextFunction } from 'express';
import { SlackService } from '../services/slackService';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth';
import { AuthUser, ApiResponse, SlackAuthRequest, CustomError } from '../types';
import { userStorage } from '../utils/storage';
import { z } from 'zod';

// Validation schemas
const slackAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().optional(),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export class AuthController {
  private slackService: SlackService;

  constructor() {
    this.slackService = new SlackService();
  }

  /**
   * Handle Slack OAuth login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const validation = slackAuthSchema.safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid request data', 400);
      }

      const { code } = validation.data;

      // Handle OAuth with Slack
      const authResponse = await this.slackService.handleOAuth(code);

      // Create AuthUser object
      const authUser: AuthUser = {
        id: authResponse.userId,
        name: authResponse.userId, // Will be updated from storage
        email: '', // Will be updated from storage
        teamId: authResponse.teamId,
        teamName: authResponse.teamName,
        accessToken: authResponse.accessToken,
        avatar: undefined,
      };

      // Get user details from storage
      const userData = await userStorage.read();
      const user = userData.users.find(u => u.id === authResponse.userId);
      if (user) {
        authUser.name = user.name;
        authUser.email = user.email;
        authUser.avatar = user.avatar;
      }

      // Generate tokens
      const accessToken = generateToken(authUser);
      const refreshToken = generateRefreshToken(authUser.id);

      const response: ApiResponse<{
        user: AuthUser;
        accessToken: string;
        refreshToken: string;
        channels: any[];
      }> = {
        success: true,
        data: {
          user: authUser,
          accessToken,
          refreshToken,
          channels: authResponse.channels,
        },
        message: 'Successfully authenticated with Slack',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   */
  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const validation = refreshTokenSchema.safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid request data', 400);
      }

      const { refreshToken } = validation.data;

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user from storage
      const userData = await userStorage.read();
      const user = userData.users.find(u => u.id === decoded.userId);
      
      if (!user) {
        throw new CustomError('User not found', 401);
      }

      // Create AuthUser object
      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        teamId: 'unknown', // Would need to be stored or retrieved
        teamName: 'Unknown Team',
        accessToken: '', // Would need to be stored or refreshed
        avatar: user.avatar,
      };

      // Generate new tokens
      const newAccessToken = generateToken(authUser);
      const newRefreshToken = generateRefreshToken(authUser.id);

      const response: ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }> = {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user information
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const response: ApiResponse<AuthUser> = {
        success: true,
        data: req.user,
        message: 'User information retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just return a success response
      // The client should remove the token from storage

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Successfully logged out',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's accessible channels
   */
  getChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      // Create Slack service with user's access token
      const slackService = new SlackService(req.user.accessToken);
      
      // Test connection first
      const isConnected = await slackService.testConnection();
      if (!isConnected) {
        throw new CustomError('Slack connection failed', 401);
      }

      // Get channels
      const channels = await slackService.getChannels();

      const response: ApiResponse<any[]> = {
        success: true,
        data: channels,
        message: 'Channels retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test Slack connection
   */
  testConnection = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new CustomError('User not authenticated', 401);
      }

      const slackService = new SlackService(req.user.accessToken);
      const isConnected = await slackService.testConnection();

      const response: ApiResponse<{ connected: boolean }> = {
        success: true,
        data: { connected: isConnected },
        message: isConnected ? 'Slack connection successful' : 'Slack connection failed',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get authentication status
   */
  status = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAuthenticated = !!req.user;

      const response: ApiResponse<{
        authenticated: boolean;
        user?: AuthUser;
      }> = {
        success: true,
        data: {
          authenticated: isAuthenticated,
          user: req.user || undefined,
        },
        message: isAuthenticated ? 'User is authenticated' : 'User is not authenticated',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
