import { Request, Response } from 'express';
import { readJsonFile, writeJsonFile } from '../utils/storage';

const TAGS_FILE = 'data/tags.json';

export const getTags = async (req: Request, res: Response) => {
  try {
    const data = await readJsonFile(TAGS_FILE) as any;
    const tags = data.tags || [];
    
    res.json({
      success: true,
      data: { tags },
      message: 'Tags retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve tags',
      message: 'Internal server error'
    });
  }
};

export const getTagById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await readJsonFile(TAGS_FILE) as any;
    const tag = data.tags?.find((t: any) => t.id === id);
    
    if (!tag) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
        message: 'Tag with the specified ID does not exist'
      });
    }
    
    return res.json({
      success: true,
      data: { tag },
      message: 'Tag retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting tag:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve tag',
      message: 'Internal server error'
    });
  }
};

export const createTag = async (req: Request, res: Response) => {
  try {
    const { name, category = 'keyword', confidence = 0.8 } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name is required'
      });
    }
    
    const data = await readJsonFile(TAGS_FILE) as any;
    const newTag = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      category,
      confidence,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    
    data.tags = data.tags || [];
    data.tags.push(newTag);
    data.lastUpdated = new Date().toISOString();
    
    await writeJsonFile(TAGS_FILE, data);
    
    return res.status(201).json({
      success: true,
      data: { tag: newTag },
      message: 'Tag created successfully'
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create tag',
      message: 'Internal server error'
    });
  }
};

export const updateTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const data = await readJsonFile(TAGS_FILE) as any;
    const tagIndex = data.tags?.findIndex((t: any) => t.id === id);
    
    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
        message: 'Tag with the specified ID does not exist'
      });
    }
    
    data.tags[tagIndex] = { ...data.tags[tagIndex], ...updates };
    data.lastUpdated = new Date().toISOString();
    
    await writeJsonFile(TAGS_FILE, data);
    
    return res.json({
      success: true,
      data: { tag: data.tags[tagIndex] },
      message: 'Tag updated successfully'
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update tag',
      message: 'Internal server error'
    });
  }
};

export const deleteTag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const data = await readJsonFile(TAGS_FILE) as any;
    const tagIndex = data.tags?.findIndex((t: any) => t.id === id);
    
    if (tagIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found',
        message: 'Tag with the specified ID does not exist'
      });
    }
    
    const deletedTag = data.tags[tagIndex];
    data.tags.splice(tagIndex, 1);
    data.lastUpdated = new Date().toISOString();
    
    await writeJsonFile(TAGS_FILE, data);
    
    return res.json({
      success: true,
      data: { tag: deletedTag },
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete tag',
      message: 'Internal server error'
    });
  }
};
