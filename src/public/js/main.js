(function() {
  
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    
    while (e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }

    return hashParams;
  }
  
  var params = getHashParams(),
      accessToken = params.accessToken,
      refreshToken = params.refreshToken,
      userId = null;
  
  if (!accessToken) {
    $('#login').show();
    $('#playlists').hide();
    return;
  }

  var playlistsTemplateSource = document.getElementById('playlists-template').innerHTML,
      playlistsTemplate = Handlebars.compile(playlistsTemplateSource),
      playlistsContainer = document.getElementById('playlists');

  var tracksTemplateSource = document.getElementById('tracks-template').innerHTML,
      tracksTemplate = Handlebars.compile(tracksTemplateSource);

  $.spotify('set-access-token', { accessToken: accessToken });
  
  $.spotify('get-current-user-info', {
    onSuccess: function(userInfo) {
      userId = userInfo.id;
      
      $.spotify('get-playlists', {
        userId: userId,
        onSuccess: function(playlists) {
          playlistsContainer.innerHTML = playlistsTemplate({ playlists: playlists });
          
          $('a.show-tracks-link').click(function(event) {
            event.preventDefault();
            
            var playlistId = $(this).attr('href');
            // TODO: Retrieve and show tracks
          });
          
          $('a.export-link').click(function() {
            event.preventDefault();
            
            var playlistId = $(this).attr('href');
            
            $.spotify('export-playlist', {
              userId: userId,
              playlistId: playlistId,
              onSuccess: function(playlist) {
                var href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(playlist)),
                    link = document.createElement('a');
                
                link.setAttribute('href', href);
                link.setAttribute('download', playlist.id + '_' + playlist.name.replace(/\s+/, '') + '.json');
                link.click();
              }
            });
          });
        }
      });
    }
  });

  $('#login').hide();
  $('#loggedin').show();

//  document.getElementById('obtain-new-token').addEventListener('click', function() {
//    $.ajax({
//      url: '/refresh_token',
//      data: {
//        'refresh_token': refresh_token
//      }
//    }).done(function(data) {
//      access_token = data.access_token;
//      oauthPlaceholder.innerHTML = oauthTemplate({
//        access_token: access_token,
//        refresh_token: refresh_token
//      });
//    });
//  }, false);

})();