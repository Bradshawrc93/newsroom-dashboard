import { Request, Response, NextFunction } from 'express';
import { SquadService } from '../services/squadService';
import { SquadConfig, ChannelConfig, PersonConfig, TagConfig } from '../config/squads';
import { ApiResponse, CustomError } from '../types';
import { z } from 'zod';

// Validation schemas
const squadSchema = z.object({
  id: z.string().min(1, 'Squad ID is required'),
  name: z.string().min(1, 'Squad name is required'),
  description: z.string().optional(),
  parentSquad: z.string().optional(),
  channels: z.array(z.object({
    id: z.string(),
    name: z.string(),
    squad: z.string(),
    isPrimary: z.boolean(),
    description: z.string().optional(),
    relatedChannels: z.array(z.string()).optional(),
  })).optional(),
  tags: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(['keyword', 'person', 'squad', 'custom']),
    squad: z.string().optional(),
    description: z.string().optional(),
    confidence: z.number().min(0).max(1),
  })).optional(),
  people: z.array(z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().optional(),
    squad: z.string(),
    role: z.string().optional(),
    avatar: z.string().optional(),
    commonTags: z.array(z.string()),
  })).optional(),
  subsquads: z.array(z.string()).optional(),
});

const channelSchema = z.object({
  id: z.string().min(1, 'Channel ID is required'),
  name: z.string().min(1, 'Channel name is required'),
  squad: z.string().min(1, 'Squad is required'),
  isPrimary: z.boolean(),
  description: z.string().optional(),
  relatedChannels: z.array(z.string()).optional(),
});

const personSchema = z.object({
  id: z.string().min(1, 'Person ID is required'),
  name: z.string().min(1, 'Person name is required'),
  email: z.string().optional(),
  squad: z.string().min(1, 'Squad is required'),
  role: z.string().optional(),
  avatar: z.string().optional(),
  commonTags: z.array(z.string()),
});

const tagSchema = z.object({
  id: z.string().min(1, 'Tag ID is required'),
  name: z.string().min(1, 'Tag name is required'),
  category: z.enum(['keyword', 'person', 'squad', 'custom']),
  squad: z.string().optional(),
  description: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export class SquadController {
  private squadService: SquadService;

  constructor() {
    this.squadService = new SquadService();
  }

  /**
   * Initialize squad data
   */
  initialize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.squadService.initializeSquadData();
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Squad data initialized successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all squads
   */
  getAllSquads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const squads = await this.squadService.getAllSquads();
      
      const response: ApiResponse<SquadConfig[]> = {
        success: true,
        data: squads,
        message: 'Squads retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get main squads
   */
  getMainSquads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const squads = await this.squadService.getMainSquads();
      
      const response: ApiResponse<SquadConfig[]> = {
        success: true,
        data: squads,
        message: 'Main squads retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get subsquads
   */
  getSubsquads = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { parentSquadId } = req.params;
      const subsquads = await this.squadService.getSubsquads(parentSquadId);
      
      const response: ApiResponse<SquadConfig[]> = {
        success: true,
        data: subsquads,
        message: 'Subsquads retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get squad by ID
   */
  getSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId } = req.params;
      const squad = await this.squadService.getSquad(squadId);
      
      if (!squad) {
        throw new CustomError('Squad not found', 404);
      }

      const response: ApiResponse<SquadConfig> = {
        success: true,
        data: squad,
        message: 'Squad retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get squad hierarchy
   */
  getSquadHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hierarchy = await this.squadService.getSquadHierarchy();
      
      const response: ApiResponse<any[]> = {
        success: true,
        data: hierarchy,
        message: 'Squad hierarchy retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get squad statistics
   */
  getSquadStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.squadService.getSquadStats();
      
      const response: ApiResponse<any> = {
        success: true,
        data: stats,
        message: 'Squad statistics retrieved successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add new squad
   */
  addSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validation = squadSchema.safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid squad data', 400);
      }

      const squad = validation.data;
      await this.squadService.addSquad(squad as any);
      
      const response: ApiResponse<SquadConfig> = {
        success: true,
        // @ts-ignore
        data: squad,
        message: 'Squad added successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update squad
   */
  updateSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId } = req.params;
      const validation = squadSchema.partial().safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid squad data', 400);
      }

      const updates = validation.data;
      // @ts-ignore
      const success = await this.squadService.updateSquad(squadId, updates);
      
      if (!success) {
        throw new CustomError('Squad not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Squad updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove squad
   */
  removeSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId } = req.params;
      const success = await this.squadService.removeSquad(squadId);
      
      if (!success) {
        throw new CustomError('Squad not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Squad removed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add channel to squad
   */
  addChannelToSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId } = req.params;
      const validation = channelSchema.safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid channel data', 400);
      }

      const channel = validation.data;
      // @ts-ignore
      const success = await this.squadService.addChannelToSquad(squadId, channel);
      
      if (!success) {
        throw new CustomError('Squad not found', 404);
      }

      const response: ApiResponse<ChannelConfig> = {
        success: true,
        // @ts-ignore
        data: channel,
        message: 'Channel added to squad successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove channel from squad
   */
  removeChannelFromSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId, channelId } = req.params;
      const success = await this.squadService.removeChannelFromSquad(squadId, channelId);
      
      if (!success) {
        throw new CustomError('Squad or channel not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Channel removed from squad successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add person to squad
   */
  addPersonToSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId } = req.params;
      const validation = personSchema.safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid person data', 400);
      }

      const person = validation.data;
      // @ts-ignore
      const success = await this.squadService.addPersonToSquad(squadId, person);
      
      if (!success) {
        throw new CustomError('Squad not found', 404);
      }

      const response: ApiResponse<PersonConfig> = {
        success: true,
        // @ts-ignore
        data: person,
        message: 'Person added to squad successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove person from squad
   */
  removePersonFromSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId, personId } = req.params;
      const success = await this.squadService.removePersonFromSquad(squadId, personId);
      
      if (!success) {
        throw new CustomError('Squad or person not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Person removed from squad successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add tag to squad
   */
  addTagToSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId } = req.params;
      const validation = tagSchema.safeParse(req.body);
      if (!validation.success) {
        throw new CustomError('Invalid tag data', 400);
      }

      const tag = validation.data;
      // @ts-ignore
      const success = await this.squadService.addTagToSquad(squadId, tag);
      
      if (!success) {
        throw new CustomError('Squad not found', 404);
      }

      const response: ApiResponse<TagConfig> = {
        success: true,
        // @ts-ignore
        data: tag,
        message: 'Tag added to squad successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove tag from squad
   */
  removeTagFromSquad = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { squadId, tagId } = req.params;
      const success = await this.squadService.removeTagFromSquad(squadId, tagId);
      
      if (!success) {
        throw new CustomError('Squad or tag not found', 404);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Tag removed from squad successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export configuration
   */
  exportConfiguration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.squadService.exportConfiguration();
      
      const response: ApiResponse<string> = {
        success: true,
        data: config,
        message: 'Configuration exported successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Import configuration
   */
  importConfiguration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { config } = req.body;
      
      if (!config || typeof config !== 'string') {
        throw new CustomError('Configuration JSON is required', 400);
      }

      await this.squadService.importConfiguration(config);
      
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Configuration imported successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
