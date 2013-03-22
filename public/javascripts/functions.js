var KEYCODE_ESC = 27;
var KEYCODE_ENTER = 13;
var KEYCODE_TAB = 9;
var KEYCODE_BACKSPACE = 8;
var KEYCODE_M = 77;
var KEYCODE_S = 83;

$(document).ready(function() {

  // ngw is an object that stores variables to the browser window. Used to communicate some variables with functionsDropbox.js.
  var ngw = window.ngw || (window.ngw = {
    isFooterScreenOn : false,
    isPreviewOn : false,
    screen : 'none',
    openScreen : 'none'
  }); 

  var input = $('#input');

  ngw.key = [document.getElementById('key1'),
              document.getElementById('key2'),
              document.getElementById('key3'),
              document.getElementById('key4')];
  ngw.backspace = [document.getElementById('backspace1'),
                    document.getElementById('backspace2'),
                    document.getElementById('backspace3'),
                    document.getElementById('backspace4')];
  ngw.enter = [document.getElementById('enter1'),
              document.getElementById('enter2'),
              document.getElementById('enter3'),
              document.getElementById('enter4'),
              document.getElementById('enter5')];

  // Set firstTime to false on first keypress
  if (!localStorage.getItem('firstTime'))
    $('#input').one('change', function() {
      localStorage.setItem('firstTime', 'false');
      footer.css('top', '-40px');
      $('.nav-collapse').collapse('hide');
    });

  // Footer
  footerTriggerInit();

  // Retrieve and set previous font family and size
  if (localStorage.getItem('font') || localStorage.getItem('fontSize')) {
    $('.text').css("font-family", localStorage.getItem('font'));
    if (localStorage.getItem('fontSize')) {
      $('#font-size').val(localStorage.getItem('fontSize'));
      ngw.fontSize = 16;  // Temporary set this var to 16 so initial changeFontSize call works.
    }
    else {
      ngw.fontSize = 16;
      localStorage.setItem('fontSize', '16');
    }
    changeFontSize();
  }

  // Retrieve and set saved text
  if (Modernizr.localstorage && localStorage.getItem('text')) {
    var savedText = "";
    try {
      savedText = localStorage.getItem('text');
    } catch(e) {}
    if (savedText) {
      $('#input').val(savedText);
      savedText = savedText.replace(/(^\s*)|(\s*$)/gi,"");
      savedText = savedText.replace(/[ ]{2,}/gi," ");
      savedText = savedText.replace(/\n /,"\n");
    }
  } 

  // Save text on interval
  try {
    if(localStorage.getItem('firstTime') === 'false')
      setInterval(function() {
        localStorage.setItem('text', $('#input').val());
console.log('saved');
      }, 2000);
  } catch(e) {console.log('Could not save.');}

  // Parsing engine
  $.fn.selectRange = function(start, end) {
    return this.each(function() {
      if (this.setSelectionRange) {
        this.focus();
        this.setSelectionRange(start, end);
      } else if (this.createTextRange) {
        var range = this.createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', start);
        range.select();
      }
    });
  };

  function setCaretToPos (input, pos) {
    setSelectionRange(input, pos, pos);
  }

  function updateBox(wikipediaPage, box, pos, curval) {
    if (wikipediaPage === "" || !(!/[0-9\*\#\-]/i.test(wikipediaPage.charAt(0))) || 
    wikipediaPage === "?" || wikipediaPage === "!") {
      return false;
    }

    // Duckduckgo dictionary definition look up
    if (wikipediaPage.charAt(0) == '?' && wikipediaPage !== '?') {
      showParsingBar();
      var jqxhr = $.getJSON("http://api.duckduckgo.com/?q=define+" + wikipediaPage.substring(1) + "&format=json&pretty=1&callback=?&", function() {}).done(function(data) {
          text = data.Abstract;

          try {
      // process/cleanup the definition

      if (data.AbstractSource === "Merriam-Webster" && text.indexOf("definition:") > -1)
      {
           text = text.substring(text.indexOf("definition:") + 12);
      }
      else if (data.AbstractSource === "The Free Dictionary" && text.indexOf("\u00b7") > -1)
      {
  console.log(text.substring(text.lastIndexOf("\u00b7")));
           temptext = text.substring(text.lastIndexOf("\u00b7"));
           text = temptext.substring(temptext.indexOf(" ") + 1);
      }
                  if (text === "")
      throw "blank page";


            var actval = String(box.val());
            var extratextlen = actval.indexOf("\n", pos) - pos;
            var newval = actval.substring(pos, extratextlen);

            box.val(curval.substring(0, pos) + "\n\n> " + text + "\n\n" + actval.substring(pos + 1));
            //box.scrollTop(9999).focus();

            //box.focus();
            var offsetSelect = actval.length - curval.length;
            var selectpos = pos + text.length + 5 + offsetSelect;
            $(box).selectRange(selectpos, selectpos); 
            console.log(text);
            if (text === '')
              hideParsingBar('error');
            else
              hideParsingBar('success');
            } catch (err) {
              var actval = String(box.val());
              box.val(curval.substring(0,pos) + actval.substring(pos));
              var offset = actval.length - curval.length;
              $(box).selectRange(pos +offset,pos+offset);
              hideParsingBar('error');
            }

            }).error(function() {
              hideParsingBar("error");
            });
            return;
          }

    // Wikipedia look up
    showParsingBar();
    var req1 = $.ajax({ 
      type: 'GET', 
      dataType: "json", 
      url: '//en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?&redirects=', 
      data: {page:wikipediaPage, uselang:'en'}, 
      async: false, 
      error: function(){hideParsingBar('error');},
      success: function(json,wikipediaPage) {
        try {
          var text = json.parse.text["*"];
          var n = text.indexOf("/table>");
          while (n != -1) { //Gets rid of pre-content tables  
            if (n > -1) {
              text = text.substring(n+8);
            }
            n = text.indexOf("/table>");
          }

          text = text.substring(text.indexOf("<p>")+3);
          text = text.substring(0, text.indexOf("</p>"));

          var tags = /(<([^>]+)>)/ig; //Finds all tags
          text = text.replace(tags, "");

          if (text.length > 3 && (text.substring(text.length-3) == "to:")) {
            throw "disambiguation";
          }

          var citations = /(\[([^\]]+)\])/ig; //Finds bracketed citations
          text = text.replace(citations, "");

          text = text.replace(/&#160;/g, ""); //Remove symbol

          if (text.indexOf("Cite error:") > -1)
          text = text.substring(0, text.indexOf("Cite error:"));

          var firstParen = text.substring(0,15).indexOf("(");

          if (firstParen > -1) {
            var parenCount = 1;
            var curPos = firstParen + 1;
            while (parenCount > 0 && curPos < text.length) {
              if (text.charAt(curPos) == ')')
              parenCount -= 1;
              if (text.charAt(curPos) == '(')
              parenCount += 1;
              curPos += 1;
            }
            text = text.substring(0, firstParen) + text.substring(curPos+1);
          }

          text = text.replace(/^\s+|\s+$/g,''); //trim
          if (text === "")
          throw "blank page";

          var actval = String(box.val());
          var extratextlen = actval.indexOf("\n", pos) - pos;
          var newval = actval.substring(pos, extratextlen);

          box.val(curval.substring(0, pos) + "\n\n> " + text + "\n\n" + actval.substring(pos + 1));
          //box.scrollTop(9999).focus();

         // box.focus();
          var offsetSelect = actval.length - curval.length;
          var selectpos = pos + text.length + 5 + offsetSelect;
          $(box).selectRange(selectpos, selectpos); 
          console.log(text);
          if (text === '')
            hideParsingBar('error');
          else
            hideParsingBar('success');
        }
        catch (err) {
          var actval = String(box.val());
          box.val(curval.substring(0,pos) + actval.substring(pos));
          var offset = actval.length - curval.length;
          $(box).selectRange(pos +offset,pos+offset);
          hideParsingBar('error');
        } // End try catch
        } // End success function

        }); // End AJAX
      } // End updateBox


  // Catch tabs
  $('#input').on("keydown", function(e) {
    if (e.keyCode == KEYCODE_TAB) {
      e.preventDefault();
      playSound('key');
      var value = $(this).val();
      pos = $(this).prop('selectionStart');
      $(this).val(value.substring(0, pos) + "\t" + value.substring(pos));
      $(this).selectRange(pos + 1, pos+1);
    }
  });

  // Core keypress parser
  $('#input').on("keypress", function(e) {
    if (e.keyCode == KEYCODE_ENTER) {
      playSound('enter');
      var value = $(this).val();
      pos = $(this).prop('selectionStart'); //Cursor position
      var endLine = value.substring(0, pos).lastIndexOf("\n");
      if (endLine == -1)
      endLine = value.lastIndexOf("\n");
      $(this).val(value.substring(0, pos) + "\n" + value.substring(pos));
      $(this).selectRange(pos + 1, pos + 1);
      // Note: do NOT try to access value here - leads to extra lines being inserted
      updateBox(value.substring(endLine+1,pos), $(this), pos, value);
      return false; // prevent the button click from happening
      } else if (e.keyCode != KEYCODE_BACKSPACE) {
        playSound('key');
      } else {
        playSound('backspace');
      }
  });

  // Markdown preview
  $(document).on("keydown", function(e) {
    if (e.keyCode == KEYCODE_M && e.ctrlKey) {
      togglePreviewMode();
      e.preventDefault();
      return false;
    }
  });

  $('#markdownMode').on('click', function(e){
    if ($('#input').val() === '')
    $('#input').val('####NoteGenie 101\n---\n \nNoteGenie is a better way to write. It\'s a notepad powered by the infinite knowledge of databases. You type in a term you don\'t know in it\'s own line, press enter, and NoteGenie will paste a description of the term right below the term.\n \n- NoteGenie also supports Markdown, which allows you to format text using symbols.\n- For example, the \"NoteGenie 101\" up top becomes a header because it has hash symbols at the beginning. You can give it 1-6 hash symbols depending on how big you want the header. More hashes means **smaller** header.\n- Did I mention that two asterisks surrounding text makes that text **bold**?\n- Also, one asterisk surrounding text makes it *italicized*.\n- A single dash at the start of a line indicates a list item.\n* So does an asterisk.\n\nYou can even do quotes like this:\n\n> Just put a greater than sign in front of text,\n> and you get a quoted message!\n\nAnd numbered lists like this:\n\n1. One caveat: You must put an empty line between lists, quotes, and headers. \n2. Otherwise, everything gets smashed together.\n3. See for yourself.\n \nYou can also write [links](http://notegenie.io). And insert images:\n\n![Flight](images/flight.jpg) \n \n##### Syntax highlighting\n \nYou can also write code!\n \nHTML:\n \n\t<h1>HTML code</h1>\n\t<p class=\"some\">This is an example</p>\n \nPython:\n \n\tdef func():\n\tfor i in [1, 2, 3]:\n\tprint \"%s\" % i');
    togglePreviewMode();
    e.preventDefault();
  });

  // Change fonts
  $('.font-btn').on("click", function(e) {
    $('.text').css("font-family", $(this).data('font'));
    localStorage.setItem('font', $(this).data('font'));
  });

  // Change font size
  $('#font-size').on("change", function(e) {
      changeFontSize(e);
  });

  $('#font-size').on("keydown", function(e) {
    if (e.keyCode == KEYCODE_ENTER) {
      e.preventDefault();
      changeFontSize(e);
      return false;
    }
  });

  // Footer Screen Mode
  $("[id$='Screen']").fadeOut();
  $('.footerScreenTrigger').on('click', function(e){
    ngw.screen = e.target.dataset.target; // Screen to be opened
    if (!ngw.isFooterScreenOn) {
      $('#' + e.currentTarget.id).addClass('active');
      ngw.isFooterScreenOn = true;
      ngw.openScreen = ngw.screen;
      $('#footer').css('height', '100%');
      $('#' + ngw.screen).fadeIn();
      $('#closeScreen').fadeIn();
    } else if (ngw.screen === ngw.openScreen){
      closeAll();
    } else {
      $('a.active').removeClass('active');
      $('#' + e.currentTarget.id).addClass('active');
      $('#' + ngw.openScreen).fadeOut();
      $('#' + ngw.screen).fadeIn();
      ngw.openScreen = ngw.screen;
    }
    e.preventDefault();
  });

  $(document).on('keydown', function(e) {
    if (e.keyCode == KEYCODE_ESC) {
      closeAll();
    } 
  });

  $('#closeScreen').on('click', function(e) {
    closeAll();
  });


  // Manually clear stuck loading bars
  try {
      setInterval(function() {
        if($('.progress'))
        $('.progress').fadeOut();
      }, 5000);
  } catch(e) {console.log('failed');}

  var tutorial = '###NoteGenie 101\nThe first note-taking app that writes descriptions of unfamiliar terms for you. To use NoteGenie, take notes like you normally would, but when you want to look up an unfamiliar term, type it in a new line and then press SHIFT + ENTER. Like this,\n\nDiscrete Mathematics\n> Discrete mathematics is the study of mathematical structures that are fundamentally discrete rather than continuous. In contrast to real numbers that have the property of varying \"smoothly\", the objects studied in discrete mathematics \u2013 such as integers, graphs, and statements in logic \u2013 do not vary smoothly in this way, but have distinct, separated values. Discrete mathematics therefore excludes topics in \"continuous mathematics\" such as calculus and analysis. \n\n####Formatting\n- To take bulleted notes, put a dash before each line.\n\t- You can indent bullets.\n- To create a heading, put hash symbols at the beginning of a line. \n\t- 1 hash = biggest heading. 6 hashes = smallest heading.\n- To bold, surround text in **two** asterisks. \n- To italicize, surround text in *one* asterisk.\n---\n1. To create numbered bullets, type in a number and a period before each line.\n2. To insert links, use this format: [NoteGenie](http://notegenie.io)\n3. To insert images, use this format: ![Flight](http://notegenie.io/images/flight-cover.jpg)\n\nWhen you\'re done press **CTRL + M** to see a formatted version of your notes with links and images& and press **CTRL + M** to go back into editing mode.\n\n####Saving Notes\n1. Login\n2. Type in a name in the navbar file name field\n3. Press \"Save\"\n\n####Loading Notes\n1. Press \"Files\"\n2. Click the file you want to open\n\t- Note: NoteGenie only accesses files under Apps/NoteGenie/ in your Dropbox storage.\n\nThat\'s all. Try it out today!';
  $('#tutorial').on('click', function(){
    clearInterval(ngw.interval);
    autoType(tutorial, $('#input'));
  });

    if(localStorage.getItem('firstTime') != 'false') {
      localStorage.setItem('firstTime', 'false');
      autoType(tutorial, $('#input'));
    }  

});

function footerTriggerInit(){
  var footer = $('#footer');
  $('#footer-trigger').hoverIntent({
    over: function(){
      footer.css('top','0px');
      $('.progress.progress-striped.active').css('top','40px');
  },
    out: function(){
      footer.css('top', '-40px');
      $('.nav-collapse').collapse('hide');
      $('.progress.progress-striped.active').css('top','0px');
    },
    timeout: 1000
  });
}

function closeAll(){
  $("[id$='Screen']").fadeOut();
  $('.nav-collapse').collapse('hide');
  $('[id="alertBox"]').fadeOut();
  $('#footer').removeAttr('style');
  $('#preview').css("opacity", 0);
  $('#preview').css("visibility", "hidden");
  $('body, html').css("background", "");
  $('a.active').removeClass('active');
  ngw.screen = ngw.openScreen = 'none';
  ngw.isFooterScreenOn = false;
  ngw.isPreviewOn = false;
  footerTriggerInit();
}

function showParsingBar() {
  $('body').prepend('<div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div>');
  if ($('#footer').css('top') === '0px')
      $('.progress').css('top', '40px');
}

function hideParsingBar(type) {
  if (type == 'success') {
    $('.progress:first').addClass('progress-success').delay(800).fadeOut();
  } else if (type == 'error') {
    $('.progress:first').addClass('progress-danger').delay(800).fadeOut();  
  } else {
    $('.progress:first').delay(800).fadeOut();  
  }
  $('.progress[style$="display: none;"]').remove();
    
}

function togglePreviewMode() {
  var preview = $('#preview');
  if(!ngw.isPreviewOn) {
    var tokens = marked.lexer($('#input').val());
    preview.html(marked.parser(tokens));
    preview.css("opacity", 1);
    preview.css("visibility", "visible");
    $('body, html').css("background","white");
    $('#markdownMode').addClass('active');
    ngw.isPreviewOn = true;
    $('#input').blur();
  }
  else {
    preview.css("opacity", 0);
    preview.css("visibility", "hidden");
    $('body, html').css("background", "");
    $('#markdownMode').removeClass('active');

    ngw.isPreviewOn = false;
    $('#input').focus();
  }
}

// Sets Up Alert
// If first three vars are null, just show cloes button.
function setupAlert(action, actionName, fileName, content) {
  $('#alertContent').html(content);
  if (action !== null) {
    $('#saveAction, #action').css('visibility', 'visible');
    $('#saveAction').html('Save &amp; ' + actionName).on('click', function(e) {
      saveFile(currentFile); 
      action(fileName);
      $('[id="alertBox"]').fadeOut();
    });
    $('#action').html(actionName).on('click', function(e) {
      action(fileName);
      $('[id="alertBox"]').fadeOut();
    });
  } else {
    $('#saveAction, #action').css('visibility', 'hidden');
  }
  $('#closeAlert').on('click', function(e){
    $('[id="alertBox"]').fadeOut();
  });
}

// Changes font size
function changeFontSize(e) {
  var newSize = $('#font-size').val();
  var sizeChange = newSize - ngw.fontSize;
  $('.text').css("font-size", '+=' + sizeChange);
  $('#input, #preview, .text').find('body, h6, h5, h4, h3, h2, h1, blockquote').css("font-size", '+=' + sizeChange);
  ngw.fontSize = newSize;
  localStorage.setItem('fontSize', newSize);
}

// Autotyper
function autoType(text, input) {
  var textArray = text.split("");
  var rand = 50;
  var toggledelay = 500;
  var toggletrack = 0;

  function frameLooper(textArray) {
console.log("welcome");
    if(textArray.length > 0) {
      if (textArray[0] == '\n')
        playSound('enter');
      else if (textArray[0] == ' ')
        playSound('key');
      $('#input').val($('#input').val() + textArray.shift()); 
      // Handle description pasting
      if (textArray[0] === '>')
        while (textArray[0] != '\n')
          $('#input').val($('#input').val() + textArray.shift()); 
      if (textArray[0] === '&') // Handle toggle in and out of preview mode
      {
	togprev = function () {

	  var preview = $('#preview');
	  if(!ngw.isPreviewOn) {
	    var tokens = marked.lexer($('#input').val());
	    preview.html(marked.parser(tokens));
	    preview.css("opacity", 1);
	    preview.css("visibility", "visible");
	    $('body, html').css("background","white");
	    $('#markdownMode').addClass('active');
	    ngw.isPreviewOn = true;
	    $('#input').blur();
	    clearInterval(ngw.interval);
            ngw.interval = setInterval(togprev, 3000);
	  }
	  else {
	    preview.css("opacity", 0);
	    preview.css("visibility", "hidden");
	    $('body, html').css("background", "");
	    $('#markdownMode').removeClass('active');

	    ngw.isPreviewOn = false;
	    $('#input').focus();
	clearInterval(ngw.interval);
           textArray.shift();
         ngw.interval = setInterval(function() {frameLooper(textArray);}, rand);
	  }
	 }
	clearInterval(ngw.interval);
        ngw.interval = setInterval(togprev, rand);
	
      }
    } else {
      clearInterval(ngw.interval);
       //togglePreviewMode();	// show preview mode at end?
    }
  }
  
  input.val('');

  ngw.interval = setInterval(function(){
    frameLooper(textArray); 
  }, rand);
}

var keyNum = 0;
var backspaceNum = 0;
var enterNum = 0;
// Sounds
function playSound(type) {
  if (type === 'key') {
    if (keyNum > 3)
      keyNum = 0;
    ngw.key[keyNum].volume = (Math.random() * 0.3);
    ngw.key[keyNum].play();
    keyNum++;
  } else if (type === 'enter') {
    if (enterNum > 4)
      enterNum = 0;
    ngw.enter[enterNum].volume = 0.5 + (Math.random() * 0.5);
    ngw.enter[enterNum].play();
    enterNum++;
  } else if (type === 'backspace') {
    if (backspaceNum > 3)
      backspaceNum = 0;
    ngw.backspace[backspaceNum].volume = 0.5 + (Math.random() * 0.5);
    ngw.backspace[backspaceNum].play();
    backspaceNum++;
  }
}
