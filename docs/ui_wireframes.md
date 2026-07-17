# UI for Share-Fastly

## Header:
1. header: the overall screens of application should have a common header with the following elements:
    - logo of the application on the left side
    - two tabs on the right side: "Explore" and "Dashboard" one of them should be highlighted based on the current screen

## Main Screens:
2. Explore Screen: this screen shows all the publicly available channels and it contains:
    - a search bar at the top left to search for channels
    - Search bar: live-filter as you type on client side. if the user types a channel name, it should filter the channels based on the channel name and show only those channels which match the search query.
    - a button named "access private channel" next to the search bar in right which opens a modal (tmp) to enter the channel name and password
    - a logout from all the channels button at right position in this screen
    - a list of channels displayed in a grid format with the following information for each channel:
        - channel name
        - time ago
    - if there is no channel exists, show a message "No channels found" in the center of the screen

3. Dashboard Screen: this screen shows all the channels created by the user and it contains:
    - a button named "create new channel" at the top right which opens a modal (tmp) to enter the new channel name, type (public/private), and password
    - a logout from user account button at right position in this screen
    - a list of channels displayed in a grid format with the following information for each 
    channel:
        - channel name
        - channel type (public/private)
        - an eye icon to view the channel password
        - time ago
    - if there is no channel exists, show a message "No channels found" in the center of the screen

4. Channel Screen: this screen shows all the files uploaded to a specific channel and it contains:
    - a search bar at the top left to search for files
    - a button named "upload new file" next to the search bar in right which opens a modal (tmp) to upload a new files
    - a list of files displayed in a grid format with the following information for each file:
        - original file name
        - file size
        - mime type
        - number of downloads
        - number of likes
        - time ago

## Now modal screens (like popups) for the above screens:
5. login/signup modal: this modal is used for user authentication and it contains:
    - a form with the following fields:
        - email
        - password
        - confirm password (only for signup)
    - a button to submit the form
    - a link to switch between login and signup

6. access private channel modal: this modal is used to access a private channel and it contains the following fields:
    - channel name
    - channel password
    - a button to submit the form

7. upload new file modal: this modal is used to upload a new file to a channel and it contains the following fields:
    - file input to select the file
    - a button to submit the form
    - a loading indicator to show the progress during the upload process

# UX for Share-Fastly
## Auth flow
1. If the user is new take them to welcome screen it contains a description and usage video of the application and 
    - a button to create channel which takes them to the Dashboard screen.
    - a button to explore public channels which takes them to the Explore screen.

2. If the user is already logged in take them to the Dashboard screen.
3. If the user is not logged in take them to the Explore screen.
4. If the user is not logged in and tries to access the Dashboard screen pop up the login/signup modal in /dashboard route.
5. once the use is logged in just remove the login/signup modal and show the dashboard screen.

## Channel flow
6. If the user is on the Explore screen and clicks on a public channel, take them to the Channel screen of that channel.
7. If the user is on the Explore screen and clicks on a private channel, pop up the access private channel modal and if the user enters the correct password, take them to the Channel screen of that channel.
8. If the user is on the Dashboard screen and clicks on a channel, take them to the Channel screen of that channel. even if the channel is private, by using the password to get channel token and automatically access the channel.
9. If the user is on the Channel screen and clicks on the upload new file button, pop up the upload new file modal and if the user uploads a file, show a success message and refresh the list of files in that channel.
10. If the user is on the Channel screen and clicks on a file, download the file and increment the number of downloads for that file.
11. if the user clicks on the like button for a file, increment the number of likes for that file.
12. If the user clicks upload file in the public channel it first asks for the channel password with access private channel modal (6) where channel name is already filled and disabled and user have to enter password and if the password is correct, it allows the user to upload the file using upload new file modal.but If it is private channel don't ask for password as users are already authenticated and have access to the channel.
14. every channel or files should be sorted according the the time stamp latest first
15. each file should have a download button and a like button. if the user clicks on the like button, it should increment the number of likes for that file. if the user clicks on the download button, it should download the file and increment the number of downloads for that file. and save the like state in local to prevent multiple likes from the same user for the same file.
16. the download and upload should handel by client side and should not be handled by the server. the server should only provide the signed url for the file to download or upload. and after upload make sure to call the complete api to notify the server as in api docs