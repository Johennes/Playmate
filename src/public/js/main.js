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
  
  const params = getHashParams();

  var accessToken = params.accessToken
      refreshToken = params.refreshToken;
  
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

  $.spotify('get-playlists', {
    onSuccess: function(playlists) {
      playlistsContainer.innerHTML = playlistsTemplate({ playlists: playlists });
      
      $('a.show-tracks-link').click(function(event) {
        event.preventDefault();
        
        var playlistId = $(this).attr('href');
        console.log(playlistId);
      });
      
      $('a.export-link').click(function() {
        event.preventDefault();
        
        var playlistId = $(this).attr('href');
        console.log(playlistId);
        
        $.spotify('export-playlist', { playlistId: playlistId });
      });

//      $('a.playlist-expander').click(function() {
//        var ref = $(this);
//
//        $.spotify('get-playlist-tracks', {
//          href: $(this).attr('href'),
//          onSuccess: function(tracks) {
//            ref.parent().append(playlistTracksTemplate({ tracks: tracks }));
//            console.log(tracks);
//            console.log(playlistTracksTemplate({ tracks: tracks }));
//          },
//          onError: function(jqXHR, textStatus, errorThrown) {
//            console.log(errorThrown);
//          }
//        });
//
//        return false;
//      });
    },
    onError: function(jqXHR, textStatus, errorThrown) {
      console.log(errorThrown);
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