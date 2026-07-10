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
   2. file_id (PK)
   3. file_name
   4. file_size
   5. mime_type
   6. blob_url
   7. uploaded_by (FK -> users.username)
   8. channel_name (FK -> channels.channel_name)
   9. number_of_downloads      -- raw counter, incremented on download
   10. created_at
---
1. file_likes
   2. file_id (FK -> files.file_id)
   3. username (FK -> users.username)
   4. PRIMARY KEY (file_id, username)   -- prevents duplicate likes