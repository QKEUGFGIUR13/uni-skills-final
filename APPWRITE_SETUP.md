# Appwrite Collection Setup for Career Paths

## Collection ID: career-paths

### Required Attributes:

1. **userID**
   - Type: String
   - Size: 255
   - Required: Yes
   - Array: No

2. **careerName**
   - Type: String
   - Size: 500
   - Required: Yes
   - Array: No

3. **modules**
   - Type: String
   - Size: 65535 (or max available)
   - Required: Yes
   - Array: No
   - Note: Stores JSON stringified array

4. **progress**
   - Type: Integer
   - Min: 0
   - Max: 100
   - Required: Yes
   - Default: 0

5. **completedModules**
   - Type: String
   - Size: 65535
   - Required: Yes
   - Array: No
   - Default: "[]"

6. **recommendedSkills**
   - Type: String
   - Size: 10000
   - Required: Yes
   - Array: No
   - Default: "[]"

7. **aiNudges**
   - Type: String
   - Size: 65535
   - Required: Yes
   - Array: No
   - Default: "[]"

8. **summaryGenerated**
   - Type: Boolean
   - Required: Yes
   - Default: false

9. **timestamp**
   - Type: String
   - Size: 255
   - Required: No
   - Array: Yes (Enable array)

### Indexes (Optional but Recommended):

1. **userID_index**
   - Type: Key
   - Attributes: userID
   - Order: ASC

### Permissions:

Set the following permissions for the collection:

- **Create**: 
  - Role: Any
  - Or: users (authenticated users)

- **Read**: 
  - Role: Any
  - Or: users

- **Update**: 
  - Role: Any
  - Or: users

- **Delete**: 
  - Role: Any
  - Or: users

## How to Apply:

1. Log into Appwrite Console
2. Navigate to your Database
3. Find or create the `career-paths` collection
4. Add each attribute listed above
5. Set the permissions as specified
6. Save changes

## Verify Setup:

After setup, the collection should accept documents with this structure:

```json
{
  "userID": "user123",
  "careerName": "Web Development",
  "modules": "[\"Module 1\", \"Module 2\"]",
  "progress": 0,
  "completedModules": "[]",
  "recommendedSkills": "[\"JavaScript\", \"React\"]",
  "aiNudges": "[]",
  "summaryGenerated": false,
  "timestamp": []
}
```
