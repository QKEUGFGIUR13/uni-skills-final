# Career Path Creation Debug Guide

## Common Issues and Solutions

### Issue 1: Missing Required Fields in Appwrite Collection

**Check your Appwrite collection schema for `career-paths` collection:**

Required fields:
- `userID` (string)
- `careerName` (string)
- `modules` (string - JSON array)
- `progress` (integer)
- `completedModules` (string - JSON array)
- `recommendedSkills` (string - JSON array)
- `aiNudges` (string - JSON array)
- `summaryGenerated` (boolean)
- `timestamp` (array of strings)

### Issue 2: API Key Issues

Check your `.env` file:
```
VITE_GROQ_API_KEY=your_key_here
VITE_GEMINI_API_KEY=your_key_here
```

### Issue 3: Appwrite Permissions

Make sure your Appwrite collection has proper permissions:
- Create: Any user
- Read: Any user
- Update: Any user
- Delete: Any user

### How to Debug

1. Open browser console (F12)
2. Fill out the profile form
3. Submit the form
4. Look for these log messages:
   - 🚀 Starting career path generation
   - 📊 User data for AI
   - ✅ Generated X personalized paths
   - ✅ Created career path: [name]
   - 🎉 Successfully created X career paths

### If You See Errors

**Error: "Document structure is invalid"**
- Go to Appwrite Console
- Check the `career-paths` collection attributes
- Make sure all fields listed above exist

**Error: "Invalid API key"**
- Check your `.env` file
- Restart the dev server: `npm run dev`

**Error: "Rate limit exceeded"**
- Wait a few minutes
- The AI service has rate limits

### Quick Fix: Create Collection Manually

If the collection doesn't exist or has wrong schema:

1. Go to Appwrite Console
2. Navigate to your database
3. Create/Update collection: `career-paths`
4. Add these attributes:
   - userID (String, 255)
   - careerName (String, 255)
   - modules (String, 10000)
   - progress (Integer)
   - completedModules (String, 10000)
   - recommendedSkills (String, 5000)
   - aiNudges (String, 10000)
   - summaryGenerated (Boolean)
   - timestamp (String Array)

5. Set permissions to allow all operations

### Test the Fix

1. Clear browser cache
2. Restart dev server: `npm run dev`
3. Try creating a profile again
4. Check console for success messages
