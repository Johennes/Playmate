(function($) {

  const BASE_URL = 'https://api.spotify.com/v1';

  var accessToken = null;
  

  // The main plugin function
  $.spotify = function(cmd, opts) {
    if (cmd === 'set-access-token') {
      return executeApiFunction(setAccessToken, opts, {
        accessToken: null
      });
    }
    
    if (!accessToken) {
      throw new SpotifyApiException('No access token specified');
    }

    switch (cmd) {
      case 'get-current-user-info':
        return executeApiFunction(getCurrentUserInfo, opts, {
          onSuccess: function(userInfo) {},
          onError: function(jqXHR, textStatus, errorThrown) {}
        });
      case 'get-playlist':
        return executeApiFunction(getPlaylist, opts, {
          userId: null,
          playlistId: null,
          onSuccess: function(playlist) {},
          onError: function(jqXHR, textStatus, errorThrown) {}
        });
      case 'get-playlists':
        return executeApiFunction(getPlaylists, opts, {
          userId: null,
          onSuccess: function(playlists) {},
          onError: function(jqXHR, textStatus, errorThrown) {}
        });
      case 'get-playlist-tracks':
        return executeApiFunction(getPlaylistTracks, opts, {
          href: null,
          playlistId: null,
          onSuccess: function(tracks) {},
          onError: function(jqXHR, textStatus, errorThrown) {}
        });
      case 'export-playlist':
        return executeApiFunction(exportPlaylist, opts, {
          userId: null,
          playlistId: null,
          onSuccess: function(playlist) {},
          onError: function(jqXHR, textStatus, errorThrown) {}
        });
    }
    
    throw new SpotifyApiException('Unknown API function: ' + cmd);
  };
  
  
  // Generic exception class
  function SpotifyApiException(msg) {
    this.msg = msg;
  }
  
  
  // Executes a specific API function
  function executeApiFunction(func, opts, defaults) {
    return func($.extend(defaults, opts));
  }
  
  
  // Fires a new request against the Spotify API
  function fireApiRequest(urlOrUrlSuffix, onSuccess, onError) {
    $.ajax({
      url: (urlOrUrlSuffix.indexOf('https://') === 0) ? urlOrUrlSuffix : BASE_URL + urlOrUrlSuffix,
      headers: { Authorization: 'Bearer ' + accessToken },
      success: onSuccess,
      error: onError
    });
  }
  
  
  // Fires a new request against the Spotify API and iteratively fetches and
  // combines all pages of the response
  function fireApiRequestForPagedItems(urlSuffix, onSuccess, onError) {
    var items = [];

    var callback = function(data, textStatus, jqXHR) {
      for (var i = 0; i < data.items.length; ++i) {
        items.push(data.items[i]);
      }

      if (!data.next) {
        onSuccess(items);
        return;
      }

      fireApiRequest(data.next, callback, onError);
    };

    fireApiRequest(urlSuffix, callback, onError);
  }
  
  
  // Stores a new access token
  function setAccessToken(opts) {
    accessToken = opts.accessToken;
  }
  
  
  // Retrieves the profile of the current user
  function getCurrentUserInfo(opts) {
    fireApiRequest('/me', function(data, textStatus, jqXHR) {
      opts.onSuccess(data);
    }, opts.onError);
  }
  
  
  // Retrieves a specific playlist
  function getPlaylist(opts) {
    var uri = '/users/' + encodeURIComponent(opts.userId) + '/playlists/' + encodeURIComponent(opts.playlistId);
      
    fireApiRequest(uri, function(data, textStatus, jqXHR) {
      var playlist = data,
          tracks = playlist.tracks.items;
      
      if (! playlist.tracks.next) {
        playlist.tracks = tracks;
        opts.onSuccess(playlist);
        return;
      }
      
      fireApiRequestForPagedItems(playlist.tracks.next, function(items) {
        for (var i = 0; i < items.length; ++i) {
          tracks.push(items[i]);
        }
        
        playlist.tracks = tracks;
        opts.onSuccess(playlist);
      }, opts.onError);
    }, opts.onError);
  }
  
  
  // Retrieves all playlists of a specific user
  function getPlaylists(opts) {
    var uri = '/users/' + encodeURIComponent(opts.userId) + '/playlists';
    fireApiRequestForPagedItems(uri, opts.onSuccess, opts.onError);
  }
  
  
  // Retrieves all tracks of a specific playlist
  function getPlaylistTracks(opts) {
    var uri;
    
    if (opts.href) {
      uri = encodeURIComponent(opts.href);
    } else {
      uri = '/users/' + encodeURIComponent(opts.userId) + '/playlists/' + encodeURIComponent(opts.playlistId) + '/tracks';
    }
    
    fireApiRequestForPagedItems(uri, opts.onSuccess, opts.onError);
  }
  
  
  // Exports a playlist and its tracks to JSON
  function exportPlaylist(opts) {
    getPlaylist({
      userId: opts.userId,
      playlistId: opts.playlistId,
      onSuccess: function(playlist) {
        // TODO: Remove unneeded properties
        opts.onSuccess(playlist);
      },
      onError: opts.onError
    });
  }

}(jQuery));