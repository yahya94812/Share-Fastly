# MVP for Share Fastly

## Philosophy : Ease of access
## Problem it solves : Difficulty in quick sharing/accessing of files, especially in new workspaces 

---

## Feature
1. uploading, viewing and downloading of files(documents, photos etc)
## Entities
1. user profile (creates channels)
2. channels (contain files)
3. files
## User
- login or signup via email and password 
- has a username (email id by default)
- can create public or private channels
### Channels
- channels are of 2 types (public and private)
- they have a unique names and have a password
- the user who creates channel can only see it's password from his profile
1. Public channels : public read access; write access (upload / delete) only on entering password for that channel   
2. Private : read and write access only on entering password for that channel 
# Technologies
1. React {for front end}
2. Python + Fast api {for back end}
3. postgres database
4. Azure Blob storage
5. jwt for auth