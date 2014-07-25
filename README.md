Playmate
========

Your Online Playlist Companion

This is intended to be a tool for synchronizing playlists across
different online music services.

![Playmate](screenshots/2014-07-25.png)

### Running the Application

To install any missing dependencies, run

``` javascript
npm install
```

from the root directory. Afterwards you can start the application by
running

``` javascript
node app.js
```

from within the `src` folder. By default the app will listen on port
`8880` and expect your Spotify API credentials to be stored under
`src/credentials/spotify.js` in the format

``` javascript
module.exports.CLIENT_ID     = ...
module.exports.CLIENT_SECRET = ...
module.exports.REDIRECT_URI  = 'http://localhost:8880/callback';
```

### What Works

* login to Spotify
* browsing Spotify playlists
* downloading Spotify playlists to JSON files

### What Doesn't Work (Yet)

* uploading Spotify playlists from JSON files
* Deezer integration
* Google Play Music integration
