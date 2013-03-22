$(document).ready(function() {
  var ngw = window.ngw || (window.ngw = {
    isFooterScreenOn : false, //footerScreenModeOn
    isPreviewOn : false,  //isPreviewActive
    screen : 'none',
    openScreen : 'none',
    dblclick : false

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
        // Track logins for metrics
        client.getUserInfo(function(error, userInfo, userObject) {
          if (error)
            return false;
          $.post('/', {
            uid: userInfo.uid, email: userInfo.email, name: userInfo.name
          });
        });
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
      loadDir();
    } else {
      $('#currentFile').html('<h3>Before saving and loading files, you need to log in with a Dropbox account first.</br></br>Files will be saved to "Dropbox/App/NoteGenie/".</h3>');
    }
  });

  // Load Directory
  function loadDir(path) {
    path = path || '';
    client.readdir(path, {httpCache : true}, 
      function(err, dir, stat, dirstat) {
          console.log(dirstat);
          console.log(dir);
        if (err) {
          return showError(err);
        }
        $('#fileList').html('');
        $.each(dir, function(index, value) {
          var type = dirstat[index].isFolder ? 'folder' : 'file';
          $('#fileList').append('<li><a class="' + type + '" href="#">' + dir[index] + '</a></li>');
        });
        openFile(path);
      });
    }

  // Open File Setup
  function openFile(path){
    path = path || '';
    $('.file').on('click', function(e) {
      setTimeout(function(e){
        if (!ngw.dblclick) {
          var fileName = e.target.innerText;
          e.preventDefault();
          if ($('#input').val()) {
            setupAlert(loadFile, 'Open', fileName, 'Are you sure you want to open a different file without saving the current one first?');
            $('[id="alertBox"]').fadeIn();
          } else {
            loadFile(path + fileName);
            closeAll(); 
          }
        } else
          ngw.dblclick = false;
      }, 300);
    });
    $('.file').on('dblclick', function(){
      setupRename(this, 'file');
    });
    $('.folder').on('click', function(e) {
      setTimeout(function(){
        if (!ngw.dblclick) {
          var folderName = e.target.innerText;
          e.preventDefault();
          loadDir(path + folderName + '/');
        } 
      }, 300);
    });
    $('#newFolder').off('click').on('click', function(){
      newFolder(path);
    });
    $('.folder').on('dblclick', function(){
      setupRename(this, 'folder');
    });
    $('#path').html(path);
  }

  function setupRename(target, type) {
      if (!ngw.dblclick) {
        ngw.dblclick = true;
        var name = $(target).html();
        $(target).replaceWith('<textarea id="renameBox" >' + name + '</textarea>');
        $('#renameBox').on('keypress', function(e){
          if (e.keyCode == KEYCODE_ENTER) {
            rename(path, name, $(this).val(), function(newFileName){
              $('#renameBox').replaceWith('<a class="' + type + '" href="#">' + newFileName +'</a>');
              ngw.dblclick = false;
            });
          }
        });
        $('#renameBox').on('blur', function(){
          rename(path, name, $(this).val(), function(newFileName){
            $('#renameBox').replaceWith('<a class="' + type + ' href="#">' + newFileName +'</a>');
            ngw.dblclick = false;
          });
        });
      }
  }
  function rename(path, fileName, newFileName, callback) {
    client.move(path + fileName, path + newFileName, function(){
      $('#saveNotice').fadeIn().delay(800).fadeOut(); 
      callback(newFileName);
    }); 
  }

  // Creates New Notepad
  function newFile(fileName) {  //fileName is not used. Just for convention.
    $('#input, #fileName').val('');
    $('#save').removeAttr('disabled');
    $('#fileName').removeAttr('disabled');
  }

  function newFolder(path, name) {
    path = path || '';
    name = name || 'New Folder';
    console.log('making folder: ' + path);
    
    function checkExists (path, name, callback) {
      client.stat(path + name, function(err, stat) {
        if (stat && !stat.isRemoved) {
          name += ' COPY';
          checkExists(path, name, callback);
        } else {
          callback(path, name);
        }
      });
    }
    checkExists(path, name, function(path, name) {
      client.mkdir(path + name, function(err, stat) {
        if (err)
          showError(err);
        loadDir(path);    
      });
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
    if ((!/[a-z0-9\._\- ]/i.test(currentFile)) || currentFile === "") {
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

  // !!!Callback on this authenticate doesn't work for some reason. Find out why.
  function login(callback) {
    client.authenticate({interactive: true}, function(error, client) {
      if (error)
        return showError(error);
      client.getUserInfo(function(error, userInfo) {
        if (error)
          return showError(error);
        callback();
        });
    });
  }

});
