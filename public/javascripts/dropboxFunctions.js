$(document).ready(function() {
  var ngw = window.ngw || (window.ngw = {
    isFooterScreenOn : false, //footerScreenModeOn
    isPreviewOn : false,  //isPreviewActive
    screen : 'none',
    openScreen : 'none'

  }); 

  var client = new Dropbox.Client({
    key: "KhJyIJt6dgA=|a7T1MMYdqjM/sHdA+5Ext3zvnBMVtcqe60UGqX8Upg==", 
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
      $('#save').attr('disabled', 'true');
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
      $('[id="alertBox"]').fadeIn();

    } else {
      console.log('login first');
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
        if (err) {
          return showError(err);
        }
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
    $('#fileName').removeAttr('disabled');
  }

  // Open File
  function openFile(){
    $('.file').on('click', function(e) {
      var fileName = e.target.innerText;
      e.preventDefault();
      if ($('#input').val()) {
        setupAlert(loadFile, 'Open', fileName, 'Are you sure you want to open a different file without saving the current one first?');
        $('[id="alertBox"]').fadeIn();
      } else {
        loadFile(fileName);
        closeAll(); 
      }
    });
  }

  // Loads File
  function loadFile(fileName) {
    client.readFile(fileName, {httpCache: true}, 
      function(err, file, stat, rangeInfo){
        if (err)
          return showError(err);
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

	//clean up and check the file name
    currentFile = currentFile.replace(/^\s+/,"");    // trim whitespace
    currentFile = currentFile.replace(/\s+$/,"");
    if ((!/[a-z0-9\._\- ]/i.test(currentFile)) || currentFile === "")  // invalid filename
    {
        alert("Invalid filename");
        return;
    }


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

  function login(callback) {
    client.authenticate({interactive: true}, function(error, client) {
	if (err)
		return showError(err);
      client.getUserInfo(function(error, userInfo) {
	if (err)
		return showError(err);
        console.log(userInfo.name + ' got authenticated by login().');
      });
    });
    callback();
  }

});
