(function($) {

  const BASE_URL = 'https://api.spotify.com/v1';

  var accessToken = null;
  var userId = null;

  // The main plugin function
  $.spotify = function(cmd, opts) {
    if (cmd === 'set-access-token') {
      return setAccessToken(opts);
    }

    validateAccessToken();

    switch (cmd) {  
      case 'get-user-info':
        return getUserInfo(opts);
      case 'get-playlists':
        return getPlaylists(opts);
      case 'get-playlist-tracks':
        return getPlaylistTracks(opts);
      case 'export-playlist':
        return exportPlaylist(opts);
    }
  };

  // Generic exception class
  function SpotifyApiException(msg) {
    this.msg = msg;
  }

  // Stores a new access token
  function setAccessToken(opts) {
    opts = $.extend({
      accessToken: null
    }, opts);

    accessToken = opts.accessToken;
  }

  // Validates the access token
  function validateAccessToken() {
    if (!accessToken) {
      throw new SpotifyApiException('Invalid access token');
    }
  }

  // Fires a new request against the Spotify API
  function triggerRequest(urlOrUrlSuffix, onSuccess, onError) {
    $.ajax({
      url: (urlOrUrlSuffix.indexOf('http') === 0) ? urlOrUrlSuffix : BASE_URL + urlOrUrlSuffix,
      headers: { Authorization: 'Bearer ' + accessToken },
      success: onSuccess,
      error: onError
    });
  }

  // Fires a new request against the Spotify API and combines all pages of the response
  function triggerRequestForPagedItems(urlSuffix, onSuccess, onError) {
    var items = [];

    var callback = function(data, textStatus, jqXHR) {
      for (var i = 0; i < data.items.length; ++i) {
        items.push(data.items[i]);
      }

      if (!data.next) {
        onSuccess(items);
        return;
      }

      triggerRequest(data.next, callback, onError);
    };

    triggerRequest(urlSuffix, callback, onError);
  }

  // Retrieves basic user information
  function getUserInfo(opts) {
    opts = $.extend({
      onSuccess: function(data, textStatus, jqXHR) {},
      onError: function(jqXHR, textStatus, errorThrown) {}
    }, opts);

    triggerRequest('/me', opts.onSuccess, opts.onError);
  }

  // Retrieves the user's id
  function getUserId(onSuccess) {
    getUserInfo({
      onSuccess: function(data, textStatus, jqXHR) {
        userId = data.id;
        onSuccess();
      },
      onError: function(jqXHR, textStatus, errorThrown) {
        throw new SpotifyApiException(textStatus + ': ' + errorThrown);
      }
    });
  }
  
  // Retrieves a specific playlist
  function getPlaylist(opts) {
    if (!userId) {
      getUserId(function() {
        getPlaylist(opts);
      });
      return;
    }

    opts = $.extend({
      playlistId: null,
      onSuccess: function(playlist) {},
      onError: function(jqXHR, textStatus, errorThrown) {}
    }, opts);
    
    triggerRequest('/users/' + userId + '/playlists/' + opts.playlistId, function(data, textStatus, jqXHR) {
      var playlist = data;
      var tracks = playlist.tracks.items;
      
      if (! playlist.tracks.next) {
        playlist.tracks = tracks;
        opts.onSuccess(playlist);
        return;
      }
      
      triggerRequestForPagedItems(playlist.tracks.next, function(items) {
        for (var i = 0; i < items.length; ++i) {
          tracks.push(items[i]);
        }
        
        playlist.tracks = tracks;
        opts.onSuccess(playlist);
      }, opts.onError);
    }, opts.onError);
  }

  // Retrieves all playlists
  function getPlaylists(opts) {
    if (!userId) {
      getUserId(function() {
        getPlaylists(opts);
      });
      return;
    }

    opts = $.extend({
      onSuccess: function(playlists) {},
      onError: function(jqXHR, textStatus, errorThrown) {}
    }, opts);

    triggerRequestForPagedItems('/users/' + userId + '/playlists', opts.onSuccess, opts.onError);
  }

  // Retrieves all tracks of a playlist
  function getPlaylistTracks(opts) {
    if (!userId) {
      getUserId(function() {
        getPlaylistTracks(opts);
      });
      return;
    }

    opts = $.extend({
      href: null,
      playlistId: null,
      onSuccess: function(tracks) {},
      onError: function(jqXHR, textStatus, errorThrown) {}
    }, opts);

    triggerRequestForPagedItems((opts.href) ? opts.href : '/users/' + userId + '/playlists/' + opts.playlistId + '/tracks', opts.onSuccess, opts.onError);
  }
  
  // Exports a playlist and its tracks to JSON
  function exportPlaylist(opts) {
    if (!userId) {
      getUserId(function() {
        downloadPlaylist(opts);
      });
      return;
    }

    opts = $.extend({
      playlistId: null,
      onSuccess: function(json) {},
      onError: function(jqXHR, textStatus, errorThrown) {}
    }, opts);
    
    getPlaylist({
      playlistId: opts.playlistId,
      onSuccess: function(playlist) {
        var href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playlist));
        var link = document.createElement('a');
        link.setAttribute('href', href);
        link.setAttribute('download', playlist.id + '.json');
        link.click();
      },
      onError: opts.onError
    });
  }

}(jQuery));