import { databases } from './config/database';
import { ID } from 'appwrite';

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CAREER_PATHS_COLLECTION_ID = import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID;

/**
 * Test function to verify Appwrite collection setup
 * Run this in browser console: testCareerPathCreation()
 */
export const testCareerPathCreation = async () => {
  console.log('🧪 Testing Career Path Creation...');
  console.log('Database ID:', DATABASE_ID);
  console.log('Collection ID:', CAREER_PATHS_COLLECTION_ID);
  
  const testData = {
    userID: 'test-user-' + Date.now(),
    careerName: 'Test Career Path',
    modules: JSON.stringify(['Module 1', 'Module 2', 'Module 3']),
    progress: 0,
    completedModules: JSON.stringify([]),
    recommendedSkills: JSON.stringify(['Skill 1', 'Skill 2']),
    aiNudges: JSON.stringify([]),
    summaryGenerated: false,
    timestamp: []
  };
  
  try {
    console.log('📝 Attempting to create test document...');
    const result = await databases.createDocument(
      DATABASE_ID,
      CAREER_PATHS_COLLECTION_ID,
      ID.unique(),
      testData
    );
    
    console.log('✅ SUCCESS! Test document created:', result);
    console.log('🎉 Your Appwrite collection is properly configured!');
    
    // Clean up test document
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CAREER_PATHS_COLLECTION_ID,
        result.$id
      );
      console.log('🧹 Test document cleaned up');
    } catch (deleteError) {
      console.warn('⚠️ Could not delete test document:', deleteError);
    }
    
    return { success: true, message: 'Collection is properly configured' };
  } catch (error) {
    console.error('❌ FAILED! Error creating test document:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      type: error.type,
      response: error.response
    });
    
    console.log('\n📋 Troubleshooting steps:');
    console.log('1. Check if collection "career-paths" exists in Appwrite');
    console.log('2. Verify all required attributes are created (see APPWRITE_SETUP.md)');
    console.log('3. Check collection permissions allow Create/Read/Update/Delete');
    console.log('4. Verify your .env file has correct IDs');
    
    return { success: false, error: error.message };
  }
};

// Make it available globally for easy testing
if (typeof window !== 'undefined') {
  window.testCareerPathCreation = testCareerPathCreation;
}

export default testCareerPathCreation;
