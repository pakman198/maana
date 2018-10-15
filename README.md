# Text File reader

This application is a code challenge.

The purpose of the app is to type on a form one of the listed directories
and display all the text files with the number of words contained.
In case of existing a zip file, extract files and process all the text files inside it.

My solution was using nodeJS and React to have a GUI for the user

For testing purposes, the dist folder is the only one with a .zip folder

Besides reading files from the project folder, it can also read files from any path
on the file system a.e. `/Users/myUser/Documents`

## Build

```
npm install
npm run dev-all-hook
```

Once the app is up and running, open a browser window in `http://localhost:3000`