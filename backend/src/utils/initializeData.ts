import { SquadService } from '../services/squadService';

/**
 * Initialize all data when the server starts
 */
export async function initializeData(): Promise<void> {
  try {
    console.log('🔄 Initializing squad data...');
    
    const squadService = new SquadService();
    await squadService.initializeSquadData();
    
    console.log('✅ Squad data initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing squad data:', error);
    // Don't throw error to allow server to start
  }
}
