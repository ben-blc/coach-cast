/*
  # Update Natalie's Avatar to Use Supabase Storage

  1. Changes
    - Update Natalie Sejean's avatar_url to use the Supabase storage bucket
    - The image is stored in the 'images' bucket under 'icons/natalie.jpeg'

  2. Security
    - Maintains existing RLS policies
    - No changes to existing data structure
*/

-- Update Natalie's avatar to use Supabase storage URL
UPDATE coaches 
SET avatar_url = 'https://svqnvgmqrwlkddneqhrk.supabase.co/storage/v1/object/public/images/icons/natalie.jpeg'
WHERE name = 'Natalie Sejean';

-- Add comment about the storage URL format
COMMENT ON COLUMN coaches.avatar_url IS 'Avatar image URL - can be external URL or Supabase storage URL';