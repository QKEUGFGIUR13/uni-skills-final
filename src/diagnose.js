// Quick Diagnostic Script
// Paste this in browser console to check your setup

async function diagnoseSetup() {
  console.log('🔍 Running diagnostics...\n');
  
  // Check environment variables
  console.log('1️⃣ Checking Environment Variables:');
  const envVars = {
    DATABASE_ID: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    CAREER_PATHS_COLLECTION_ID: import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID,
    USERS_COLLECTION_ID: import.meta.env.VITE_USERS_COLLECTION_ID,
    GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY ? '✅ Set' : '❌ Missing'
  };
  console.table(envVars);
  
  // Check if databases is available
  console.log('\n2️⃣ Checking Appwrite Connection:');
  try {
    const { databases } = await import('./config/database.js');
    console.log('✅ Database module loaded');
    
    // Try to list documents
    const { Query } = await import('appwrite');
    const testList = await databases.listDocuments(
      import.meta.env.VITE_APPWRITE_DATABASE_ID,
      import.meta.env.VITE_CAREER_PATHS_COLLECTION_ID,
      [Query.limit(1)]
    );
    console.log('✅ Can read from career-paths collection');
    console.log('   Documents found:', testList.total);
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('   Error type:', err.type);
    console.error('   Error code:', err.code);
  }
  
  // Check GROQ API
  console.log('\n3️⃣ Checking GROQ API:');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      }
    });
    
    if (response.ok) {
      console.log('✅ GROQ API key is valid');
    } else {
      console.error('❌ GROQ API key is invalid or expired');
      console.error('   Status:', response.status);
    }
  } catch (err) {
    console.error('❌ Cannot reach GROQ API:', err.message);
  }
  
  console.log('\n✅ Diagnostics complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Fix any ❌ errors shown above');
  console.log('2. Run testCareerPathCreation() to test document creation');
  console.log('3. Try completing your profile again');
}

// Run diagnostics
diagnoseSetup();
