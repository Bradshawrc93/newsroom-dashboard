/**
 * Initialize data when the server starts
 */
export async function initializeData(): Promise<void> {
  try {
    console.log('🔄 Initializing newsroom dashboard...');
    console.log('✅ Dashboard ready');
  } catch (error) {
    console.error('❌ Error initializing dashboard:', error);
    // Don't throw error to allow server to start
  }
}
