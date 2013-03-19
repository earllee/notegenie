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
      return showError(error);
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

  // New File
  $('#new').on('click', function() {
    if (client.isAuthenticated()) {
      setupAlert(newFile, 'Create New', '', 'Are you sure you want to create a new file without saving?');
      $('[id="saveAlert"]').css('display', 'block');

    } else {
      login(setupAlert(newFile, 'Create New', '', 'Are you sure you want to create a new file without saving?'));
    }
  });

  // Save Button
  $('#save').on('click', function(e){
    if (client.isAuthenticated())
    saveFile($('#input').val(), '', function(){
      $('#saveNotice').fadeIn().delay(800).fadeOut(); 
    });
  });


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
    } else {
      $('#currentFile').html('<h3>Before saving and loading files, you need to log in with a Dropbox account first.</br></br>Files will be saved to "Dropbox/App/NoteGenie/".</h3>');
    }
  });

  // Creates New Notepad
  function newFile(fileName) {  //fileName is not used. Just for convention.
    $('#input, #fileName').val('');
    $('#save').removeAttr('disabled');
  }

  // Open File
  function openFile(){
    $('.file').on('click', function(e) {
      var fileName = e.target.innerText;
      e.preventDefault();
      //setupAlertButtons(fileName);
      setupAlert(loadFile, 'Open', fileName, 'Are you sure you want to open a different file without saving the current one first?');
      $('#saveAlert').css('display', 'block');
    });
  }

  // Loads File
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

  // Saves File
  // @param path must end in /
  function saveFile(content, path, callback) {
    content = content || $('#input').val();
    path = path || '';
    currentFile = $('#fileName').val();
    if (currentFile.length - 4 != currentFile.indexOf('.txt'))  // Ensure txt file
      currentFile += '.txt';
    client.writeFile(path + currentFile, content, function(err, stat) {
      if (err)
        showError(err); 
      else {
        $('#fileName').attr('disabled', 'true');
        $('#fileName').val(currentFile);
        callback();
      }
    }); 
  }

  // Sets Up Alert
  function setupAlert(action, actionName, fileName, content) {
    $('#saveContent').html(content);
    $('#saveAction').html('Save &amp; ' + actionName).on('click', function(e) {
      saveFile(currentFile); 
      action(fileName);
      closeAll();
    });
    $('#action').html(actionName).on('click', function(e) {
      action(fileName);
      closeAll();
    });
    $('#closeAlert').on('click', function(e){
      $('#saveAlert').removeAttr('style');  // Removes display attr
      $('[id="saveAlert"]').removeAttr('style');
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
