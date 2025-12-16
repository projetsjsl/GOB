-- Add permissions column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- Update existing users with policies based on previous hardcoded values
UPDATE users SET permissions = '{
  "view_dashboard": true, 
  "view_emma": true, 
  "save_conversations": false, 
  "view_own_history": false, 
  "view_all_history": false
}'::jsonb 
WHERE role = 'invite';

UPDATE users SET permissions = '{
  "view_dashboard": true, 
  "view_emma": true, 
  "save_conversations": false, 
  "view_own_history": false, 
  "view_all_history": false
}'::jsonb 
WHERE role = 'client';

UPDATE users SET permissions = '{
  "view_dashboard": true, 
  "view_emma": true, 
  "save_conversations": true, 
  "view_own_history": true, 
  "view_all_history": false
}'::jsonb 
WHERE role = 'daniel';

UPDATE users SET permissions = '{
  "view_dashboard": true, 
  "view_emma": true, 
  "save_conversations": true, 
  "view_own_history": true, 
  "view_all_history": false
}'::jsonb 
WHERE role = 'gob';

UPDATE users SET permissions = '{
  "view_dashboard": true, 
  "view_emma": true, 
  "save_conversations": true, 
  "view_own_history": true, 
  "view_all_history": true
}'::jsonb 
WHERE role = 'admin';

-- Verify update
SELECT username, role, permissions FROM users;
