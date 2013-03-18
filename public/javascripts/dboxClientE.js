$(function(){
  var client = new Dropbox.Client({
    key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
    sandbox: true});
  client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));

  // Check cached credentials
  client.authenticate({interactive: false}, function(error, client) {
    if (error) {
      return handleError(error);
    }
    if (client.isAuthenticated()) {
      $('#login').html('Logout');
    } else {
      $('#save').attr('disabled', 'true');
      $('#login').html('Login');
    }
  });

  // Login Button
  $('#login').on('click', function(e){
    e.preventDefault();
    if (!client.isAuthenticated()) {
      login();
    } else {
      client.signOut(function(){
        console.log('Signed off');
        $('#login').html('Login');
        $('#save').attr('disabled', 'true');
      });
    }
  });

  // Save Button
  $('#save').on('click', function(e){
    if (client.isAuthenticated()){
      client.writeFile('test.txt', $('#input').val(), function(err, stat){
        if (err)
          showError(err);
        console.log(stat);
      });
    } else {
      login(function(){
        client.writeFile('test.txt', $('#input').val(), function(err, stat){
          if (err)
            showError(err);
          console.log(stat);
        });
      });
    }
  });

function login(callback) {
  client.authenticate({interactive: true}, function(error, client) {
    client.getUserInfo(function(error, userInfo) {
      console.log(userInfo.name + ' got authenticated by login().');
    });
  });
  callback();
}

});
