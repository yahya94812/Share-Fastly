# Tables

1. users
   3. username (PK)
   4. email (unique)
   5. password_hash
   6. created_at
---
1. channels
   3. channel_name (PK)
   4. channel_password        -- stored as plaintext, visible to owner
   5. username (FK -> users.username)
   6. channel_type (Bool: public/private)
   7. created_at
---
1. files
   1. file_id (PK)
   2. raw_file_name          -- the hashed file name with extension (in the blob)
   3. original_file_name     -- the actual file name not the hashed version
   4. file_size
   5. mime_type
   8. channel_name (FK -> channels.channel_name)
   9. number_of_downloads      -- raw counter, incremented on anonymous download
   10. number_of_likes         -- raw counter, incremented on anonymous likes
   10. created_at
