var KEYCODE_S = 83;

$(document).ready(function() {
  var ngw = window.ngw || (window.ngw = {
    isFooterScreenOn : false, //footerScreenModeOn
    isPreviewOn : false,  //isPreviewActive
    screen : 'none',
    openScreen : 'none',
    isSoundOn : true
  }); 

    ngw.dblclick = false;
    ngw.path = '';
    ngw.filePath = '';
    ngw.currentFile = '';

  var client = new Dropbox.Client({
    key: "KhJyIJt6dgA=|a7T1MMYdqjM/sHdA+5Ext3zvnBMVtcqe60UGqX8Upg==", 
    sandbox: true});
    client.authDriver(new Dropbox.Drivers.Redirect({rememberUser: true}));

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
        clearTextarea();
        $('#login').html('Login');
        $('#save').attr('disabled', 'true');
      });
    }
  });

  // Clear Textarea
  $('#clear').on('click', function() {
    if (client.isAuthenticated()) {
      setupModal([function(){saveFile(null, null, function(){clearTextarea(); ngw.path = '';}); clearTextarea(); ngw.path = '';}, function(){clearTextarea(); ngw.path = '';}, function(){}],
      ['Save & Clear', 'Clear', 'Close'], ['success', 'danger'], null, 'Are you sure you want to clear the note pad without saving?');
    } else {
      clearTextarea();
      ngw.path = '';
    }
  });

  // Save Button
  $('#save').on('click', function(e){
    if (client.isAuthenticated()) {
      ngw.currentFile = $('#fileName').val();
      if (ngw.currentFile.length === 0) {
        checkExists(ngw.path, "New Note.txt", function(path, name) {
          $('#fileName').val(path + name);
          saveFile(null, null, function(){
            $('#saveNotice').fadeIn().delay(800).fadeOut();
          });
        });
      } else {
        saveFile(null, null, function(){
          $('#saveNotice').fadeIn().delay(800).fadeOut();
        });
      }
    } else {
      // Must login  
    }
  });

  $('#input').on('keydown', function(e){
    if (e.keyCode == KEYCODE_S && (e.ctrlKey || e.metaKey)) {
      if (client.isAuthenticated()) {
        ngw.currentFile = $('#fileName').val();
        if (ngw.currentFile.length === 0) {
          checkExists(ngw.path, "New Note.txt", function(path, name) {
            $('#fileName').val(path + name);
            saveFile(null, null, function(){
              $('#saveNotice').fadeIn().delay(800).fadeOut();
            });
          });
        } else {
          saveFile(null, null, function(){
            $('#saveNotice').fadeIn().delay(800).fadeOut();
          });
        }
        } else {
          // Must login  
        }
      }
  });

  function setupNewBtns(){
    // Create New Folder
    $('#newFolder').on('click', function(){
      createNewFolder(ngw.path);
    });

    // Create New Note
    $('#newFile').on('click', function(e){
      checkExists(ngw.path, 'New Note.txt', function(path, newFileName){
        clearTextarea(null, ngw.path + newFileName, function(){
          saveFile(null, null, function(){loadDir(ngw.path);});
        });
      });
    });
  }

  // Read Directory
  $('#files').on('click', function(e) {
    if (client.isAuthenticated()) {
      loadDir(ngw.path);
      $('#fileScreenToolbar').html('<h5><a id="newFile" href="#" class="btn">Create New Note</a><a id="newFolder" href="#" class="btn">Create New Folder</a></h5>');
      setupNewBtns();
    } else {
      $('#currentFile').html('<h3>Before saving and loading files, you need to log in with a Dropbox account first.</br></br>Files will be saved to "Dropbox/App/NoteGenie/".</h3>');
    }
  });

  // Load Directory
  function loadDir(path) {
    path = path || '';

    client.readdir(path, {httpCache : true}, 
      function(err, dir, stat, dirstat) {
        if (err) {
          return showError(err);
        }
        if (path.length > 0) {
          var pathArray = path.split('/');
          var link = '';
          var expandedPath = 'Working Directory: <a href="#" data-target="">~</a>/';
          for (var i = 0; i < pathArray.length - 1; i++) {
            link += pathArray[i] + '/';
            expandedPath += '<a href="#" data-target="' + link + '">' + pathArray[i] + '</a>/';
          }
          $('#path').html(expandedPath);
          $('#path > a').on('click', function(e) {
            loadDir(e.target.dataset.target);
          });
        } else {
          $('#path').html('');
        }
        $('#fileList').html('');
        $.each(dir, function(index, value) {
          var type = dirstat[index].isFolder ? 'folder' : 'file';
          $('#fileList').append('<li class="' + type + '"><a class="' + type + '" href="#">' + dir[index] + '</a><a href="#" class="delete floatR" data-file="' + dir[index] + '">(Delete)</a></li>');
        });
        ngw.dblclick = false;
        ngw.path = path;
        openFile(path);
      });
    }

  // Sets up click handlers for opening files
  function openFile(path){
    path = path || ngw.path;
    $('a.file').on('click', function(e) {
      console.log(e);
      setTimeout(function(){
        if (!ngw.dblclick) {
          var fileName = e.target.text || e.target.children[0].text;
          e.preventDefault();
          if ($('#input').val()) {
            setupModal([function(){saveFile(null, null, loadFile(fileName));}, function(){loadFile(fileName);}, function(){}], ['Save & Open', 'Open', 'Close'], ['success', 'warning'], null, 'Are you sure you want to open a different file without saving the current one first?');
          } else {
            loadFile(fileName);
            closeAll(); 
          }
        }
      }, 300);
    });
    $('a.file').on('dblclick', function(){
      setupRename(this, 'file');
    });
    $('a.folder').on('click', function(e) {
      setTimeout(function(){
        if (!ngw.dblclick) {
          var folderName = e.target.text || e.target.children[0].text;
          e.preventDefault();
          loadDir(path + folderName + '/');
        } 
      }, 300);
    });
    $('a.folder').on('dblclick', function(){
      setupRename(this, 'folder');
    });
    $('.delete').on('click', function(e){
      console.log(e); 
      client.remove(path + e.target.dataset.file, function(){loadDir(path);});
      $(e.target.parentNode).remove();
    });
  }

  function setupRename(target, type) {
      if (!ngw.dblclick) {
        ngw.dblclick = true;
        var name = $(target).html();
        $(target).replaceWith('<textarea id="renameBox" >' + name + '</textarea>');
        $('#renameBox').focus().select();
        $('#renameBox').on('keypress', function(e){
          if (e.keyCode == KEYCODE_ENTER) {
            rename(ngw.path, name, $(this).val(), function(newFileName){
              $('#renameBox').replaceWith('<a class="' + type + '" href="#">' + newFileName +'</a>');
              ngw.dblclick = false;
              openFile(); // Reinitialize file link handlers
            });
          }
        });
        $('#renameBox').on('blur', function(){
          rename(ngw.path, name, $(this).val(), function(newFileName){
            $('#renameBox').replaceWith('<a class="' + type + ' href="#">' + newFileName +'</a>');
            ngw.dblclick = false;
            openFile();
          });
        });
      }
  }
  function rename(path, fileName, newFileName, callback) {
    client.move(path + fileName, path + newFileName, function(err, stat){
      if (err)
        showError(err);
      $('#saveNotice').fadeIn().delay(800).fadeOut(); 
      callback(newFileName);
    }); 
  }

  // Checks If Name Exists in Path
  function checkExists (path, name, callback) {
    client.stat(path + name, function(err, stat) {
      if (stat && !stat.isRemoved) {
        name = 'Copy of ' + name;
        checkExists(path, name, callback);
      } else {
        callback(path, name);
      }
    });
  }
  

  // Creates New Notepad
  // Do NOT pass params besides callback function.
  // @param path, fileName exist for consistency
  function clearTextarea(path, fileName, callback) { 
    fileName = fileName || '';
    $('#fileName').val(fileName);
    $('#input').val('');
    $('#save').removeAttr('disabled');
    $('#fileName').removeAttr('disabled');
    localStorage.setItem('currentFile', '');
    ngw.currentFile = '';
    if (callback)
      callback();
  }
  ngw.clearTextarea = clearTextarea;

  function createNewFolder(path, name) {
    path = path || '';
    name = name || 'New Folder';
    
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
    client.readFile(ngw.path + fileName, {httpCache: true}, 
      function(err, file, stat, rangeInfo){
        if (err)
          return showError(err);
        ngw.currentFile = ngw.path + fileName;
        $('#input').val(file);
        $('#fileName').val(ngw.currentFile);
        $('#fileName').attr('disabled', 'true');
        $('#currentFile').html('<h3>You are working on: ' + fileName + '</h3>');
        localStorage.setItem('currentFile', ngw.currentFile);
        closeAll();
      });
  }

  
  // Saves File
  // @param path must end in /
  function saveFile(path, fileName, callback) {
    var content = $('#input').val();
    ngw.currentFile = $('#fileName').val();

    ngw.currentFile = ngw.currentFile.replace(/^\s+/,"");
    ngw.currentFile = ngw.currentFile.replace(/\s+$/,"");

    if (ngw.currentFile.length === 0)
    ; 
    if (ngw.currentFile.length - 4 != ngw.currentFile.indexOf('.txt'))  // Ensure txt file
      ngw.currentFile += '.txt';
      client.writeFile(/*path +*/ ngw.currentFile, content, function(err, stat) {
      if (err)
        showError(err); 
      else {
        $('#fileName').attr('disabled', 'true');
        $('#fileName').val(ngw.currentFile);
        localStorage.setItem('currentFile', ngw.currentFile);
        if (callback)
          callback();
      }
    }); 
  }
  ngw.saveFile = saveFile;

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
