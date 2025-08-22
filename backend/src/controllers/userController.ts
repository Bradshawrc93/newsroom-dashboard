import { Request, Response } from 'express';
import { SlackService } from '../services/slackService';
import { readJsonFile, writeJsonFile } from '../utils/storage';
import { SlackUser } from '../types';

const USERS_FILE = 'data/users.json';

export const getUsers = async (req: Request, res: Response) => {
  try {
    // Initialize Slack service with bot token
    const botToken = process.env.SLACK_BOT_TOKEN;
    console.log('Slack bot token:', botToken ? 'Present' : 'Missing');
    console.log('Bot token starts with:', botToken ? botToken.substring(0, 10) + '...' : 'None');
    
    if (!botToken) {
      throw new Error('SLACK_BOT_TOKEN environment variable is not set');
    }
    
    const slackService = new SlackService(botToken);
    
    // Test the token first
    console.log('Testing Slack token...');
    try {
      const authTest = await slackService.client.auth.test();
      console.log('Token test successful:', authTest.team, authTest.user);
    } catch (authError) {
      console.error('Token test failed:', authError);
      throw new Error('Invalid Slack bot token');
    }
    
    // Get the list of monitored channels
    const monitoredChannelNames = [
      'thoughtful-access-voice-ai',
      'nox-health',
      'orthofi', 
      'thoughtful-epic',
      'portal-aggregator',
      'hitl-squad',
      'biowound',
      'legent',
      'thoughthub',
      'pathfinder-toolforge-alpha',
      'reporting-sdk',
      'dd-worfklow-engine-partnership',
      'customer-facing',
      'data-team',
      'dev-team'
    ];
    
    // Fetch real users from Slack
    console.log('Fetching users from Slack...');
    const allSlackUsers = await slackService.getUsers();
    console.log('Total Slack users fetched:', allSlackUsers.length);
    
    // For now, filter to a reasonable subset of users (first 20 active users)
    // In a real implementation, you'd fetch users from specific channels
    const slackUsers = allSlackUsers.slice(0, 20);
    console.log('Filtered users to show:', slackUsers.length);
    
    // Transform Slack users to our format
    const users = (slackUsers as any[])
      .filter((user: any) => !user.is_bot && !user.deleted) // Filter out bots and deleted users
      .map((user: any) => ({
        id: user.id,
        name: user.real_name || user.name,
        email: user.profile?.email || '',
        squad: slackService.inferSquadFromUserName(user.real_name || user.name),
        commonTags: [] as string[], // Will be populated based on message analysis
        createdAt: new Date().toISOString()
      }));
    
    res.json({
      success: true,
      data: { users },
      message: 'Users retrieved successfully from Slack'
    });
      } catch (error) {
      console.error('Error getting users from Slack:', error);
      console.error('Error details:', error.message);
    
    // Fallback to JSON file if Slack fails
    try {
      const data = await readJsonFile(USERS_FILE) as any;
      const users = data.users || [];
      
      res.json({
        success: true,
        data: { users },
        message: 'Users retrieved from fallback data'
      });
    } catch (fallbackError) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve users',
        message: 'Internal server error'
      });
    }
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await readJsonFile(USERS_FILE) as any;
    const user = data.users?.find((u: any) => u.id === id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }
    
    return res.json({
      success: true,
      data: { user },
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user',
      message: 'Internal server error'
    });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, squad, commonTags = [] } = req.body;
    
    if (!name || !squad) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name and squad are required'
      });
    }
    
    const data = await readJsonFile(USERS_FILE) as any;
    const newUser = {
      id: `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name,
      email: email || '',
      squad,
      commonTags,
      createdAt: new Date().toISOString()
    };
    
    data.users = data.users || [];
    data.users.push(newUser);
    data.lastUpdated = new Date().toISOString();
    
    await writeJsonFile(USERS_FILE, data);
    
    return res.status(201).json({
      success: true,
      data: { user: newUser },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create user',
      message: 'Internal server error'
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const data = await readJsonFile(USERS_FILE) as any;
    const userIndex = data.users?.findIndex((u: any) => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }
    
    data.users[userIndex] = { ...data.users[userIndex], ...updates };
    data.lastUpdated = new Date().toISOString();
    
    await writeJsonFile(USERS_FILE, data);
    
    return res.json({
      success: true,
      data: { user: data.users[userIndex] },
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user',
      message: 'Internal server error'
    });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const data = await readJsonFile(USERS_FILE) as any;
    const userIndex = data.users?.findIndex((u: any) => u.id === id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User with the specified ID does not exist'
      });
    }
    
    const deletedUser = data.users[userIndex];
    data.users.splice(userIndex, 1);
    data.lastUpdated = new Date().toISOString();
    
    await writeJsonFile(USERS_FILE, data);
    
    return res.json({
      success: true,
      data: { user: deletedUser },
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user',
      message: 'Internal server error'
    });
  }
};
