import { Request, Response } from 'express';
import { readJsonFile, writeJsonFile } from '../utils/storage';

const USERS_FILE = 'data/users.json';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const data = await readJsonFile(USERS_FILE) as any;
    const users = data.users || [];
    
    res.json({
      success: true,
      data: { users },
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
      message: 'Internal server error'
    });
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
