$(document).ready(function() {
  var ngw = window.ngw || (window.ngw = {
    isFooterScreenOn : false, //footerScreenModeOn
    isPreviewOn : false,  //isPreviewActive
    screen : 'none',
    openScreen : 'none'

  }); 

  var client = new Dropbox.Client({
    key: "Nlo4FSFkSkA=|QpwDRe2cRVnNap3sKxLywfO8pM245+xXmQuWH2g5lQ==", 
    sandbox: true});
    client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));

    var currentFile = $('#fileName').val();

    // Load Current File Name from Cache
    // Current file text is loaded in functions.js
    if (localStorage.getItem('currentFile'))
    currentFile = localStorage.getItem('currentFile');

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
    if (client.isAuthenticated())
    saveFile(currentFile);
  });

  // Save File
  // @param path must end in /
  function saveFile(content, path) {
    content = content || $('#input').val();
    path = path || '';
    client.writeFile(path + currentFile, content, function(err, stat) {
      if (err)
      showError(err); 
    }); 
  }

  // Read Directory
  $('#files').on('click', function(e) {
    if (client.isAuthenticated()) {
    client.readdir('/', {httpCache : true}, 
      function(err, dir, stat, dirstat) {
        $('#fileList').html('');
        $.each(dir, function(index, value) {
          $('#fileList').append('<li><a class="file" href="#">' + dir[index] + '</a></li>');
        });
        openFile();
      });
    }
  });

  // Open File
  function openFile(){
    $('.file').on('click', function(e) {
      var fileName = e.target.innerText;
      e.preventDefault();
      setupAlertButtons(fileName);
      $('#saveAlert').css('display', 'block');
    });
  }

  function loadFile(fileName) {
    client.readFile(fileName, {httpCache: true}, 
      function(err, file, stat, rangeInfo){
        currentFile = fileName;
        $('#input').val(file);
        $('#fileName').val(currentFile);
        $('#fileName').attr('disabled', 'true');
        $('#currentFile').html('<h3>You are working on: ' + fileName + '</h3>');
        localStorage.setItem('currentFile', currentFile);
      });
  }

  // Save Alert
  function setupAlertButtons(newFile) {
    $('#saveOpen').on('click', function(e) {
      saveFile(currentFile); 
      loadFile(newFile);
      closeAll();
    });
    $('#open').on('click', function(e) {
      loadFile(newFile); 
      closeAll();
    });
    $('#closeAlert').on('click', function(e){
      $('#saveAlert').removeAttr('style');
    });
  }

  function login(callback) {
    client.authenticate({interactive: true}, function(error, client) {
      client.getUserInfo(function(error, userInfo) {
        console.log(userInfo.name + ' got authenticated by login().');
      });
    });
    callback();
  }

});
