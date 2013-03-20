$(document).ready(function() {

  var ngw = window.ngw || (window.ngw = {
    isFooterScreenOn : false, //footerScreenModeOn
    isPreviewOn : false,  //isPreviewActive
    screen : 'none',
    openScreen : 'none'
  }); 

  var input = $('#input');
  ngw.isPreviewOn = false;

  //Set firstTime to false on first keypress
  input.one("keypress", function() {
    localStorage["firstTime"] = false;
  });

  //Set previous font
  if (localStorage["font"] || localStorage["fontSize"]) {
    $('.text').css("font-family", localStorage["font"]);
    $('.text').css("font-size", localStorage["fontSize"] + "px");
    if (localStorage["fontSize"])
      $('#font-size').val(localStorage["fontSize"]);
    else {
      ngw.fontSize = 16;
      localStorage.setItem('fontSize', '16');
    }
  }

  //Retrieve saved text
  if (Modernizr.localstorage && localStorage["text"]) {
    var savedText = "";
    try {
      savedText = localStorage["text"];
    } catch(e) {}
    if (savedText) {
      input.val(savedText);
      savedText = savedText.replace(/(^\s*)|(\s*$)/gi,"");
      savedText = savedText.replace(/[ ]{2,}/gi," ");
      savedText = savedText.replace(/\n /,"\n");
    }
  } 

  //Save text on interval
  try {
    if(localStorage["firstTime"] == "false")
      setInterval(function() {
        localStorage["text"] = input.val();
      }, 2000);
  } catch(e) {console.log('failed');}

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
            var actval = String(box.val());
            var extratextlen = actval.indexOf("\n", pos) - pos;
            var newval = actval.substring(pos, extratextlen);

            box.val(curval.substring(0, pos) + "\n\n> " + text + "\n\n" + actval.substring(pos + 1));
            box.scrollTop(9999).focus();

            box.focus();
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
          box.scrollTop(9999).focus();

          box.focus();
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
        } //End success function

        }); //End AJAX
      } //End updateBox


  // catch tabs
  $('#input').on("keydown", function(e) {
    if (e.keyCode == 9) {
      e.preventDefault();
      var value = $(this).val();
      pos = $(this).prop('selectionStart');
      $(this).val(value.substring(0, pos) + "\t" + value.substring(pos));
      $(this).selectRange(pos + 1, pos+1);
    }
  });
  
  //Core keypress parser
  $('#input').on("keypress", function(e) {
    if (e.keyCode == 13) {
      //Handle 'Enter'
      var value = $(this).val();
      pos = $(this).prop('selectionStart'); //Cursor position
      var endLine = value.substring(0, pos).lastIndexOf("\n");
      if (endLine == -1)
      endLine = value.lastIndexOf("\n");
      $(this).val(value.substring(0, pos) + "\n" + value.substring(pos));
      $(this).selectRange(pos + 1, pos + 1);

      // Note: do NOT try to access value here - leads to extra lines being inserted


      //showParsingBar();	moving this to the update function itself
      updateBox(value.substring(endLine+1,pos), $(this), pos, value);
      return false; // prevent the button click from happening
    } 
  });

  //Markdown preview
  $(document).on("keydown", function(e) {
    if (e.keyCode == 77 && e.ctrlKey) {
      //Handle Ctrl+m
      togglePreviewMode();
      e.preventDefault();
      return false;
    }
  });

  $('#markdownMode').on('click', function(e){
    if ($('#input').val() === '')  // Broken
    $('#input').val('####NoteGenie 101\n---\n \nNoteGenie is a better way to write. It\'s a notepad powered by the infinite knowledge of databases. You type in a term you don\'t know in it\'s own line, press enter, and NoteGenie will paste a description of the term right below the term.\n \n- NoteGenie also supports Markdown, which allows you to format text using symbols.\n- For example, the \"NoteGenie 101\" up top becomes a header because it has hash symbols at the beginning. You can give it 1-6 hash symbols depending on how big you want the header. More hashes means **smaller** header.\n- Did I mention that two asterisks surrounding text makes that text **bold**?\n- Also, one asterisk surrounding text makes it *italicized*.\n- A single dash at the start of a line indicates a list item.\n* So does an asterisk.\n\nYou can even do quotes like this:\n\n> Just put a greater than sign in front of text,\n> and you get a quoted message!\n\nAnd numbered lists like this:\n\n1. One caveat: You must put an empty line between lists, quotes, and headers. \n2. Otherwise, everything gets smashed together.\n3. See for yourself.\n \nYou can also write [links](http://notegenie.io). And insert images:\n\n![Flight](images/flight.jpg) \n \n##### Syntax highlighting\n \nYou can also write code!\n \nHTML:\n \n\t<h1>HTML code</h1>\n\t<p class=\"some\">This is an example</p>\n \nPython:\n \n\tdef func():\n\tfor i in [1, 2, 3]:\n\tprint \"%s\" % i');
    togglePreviewMode();
    e.preventDefault();
  });

  //Change fonts
  $('.font-btn').on("click", function(e) {
    $('.text').css("font-family", $(this).data('font'));
    localStorage["font"] = $(this).data('font');
  });

  //Change font size
  $('#font-size').on("change", function(e) {
      changeFontSize(e);

  });

  var KEYCODE_ENTER = 13;
  $('#font-size').on("keydown", function(e) {
    if (e.keyCode == KEYCODE_ENTER) {
      e.preventDefault();
      changeFontSize(e);
      return false;
    }
  });

  function changeFontSize(event) {
    //$('.text').css("font-size", $(this).val() + "px");
    var newSize = $('#font-size').val();
    var sizeChange = newSize - ngw.fontSize;
    $('#input, #preview, h6, h5, h4, h3, h2, h1').css("font-size", '+=' + sizeChange);
    ngw.fontSize = newSize;
    localStorage.setItem('fontSize', newSize);
  }


  //Logo Tooltip
  $('.brand').tooltip({trigger: 'hover', delay: {hide: 1000}, placement: 'top'});

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

  var KEYCODE_ESC = 27;

  $(document).on('keydown', function(e) {
    if (e.keyCode == KEYCODE_ESC) {
      closeAll();
    } 
  });

  $('#closeScreen').on('click', function(e) {
    closeAll();
  });

  // Footer
  footerTriggerInit();

  // Manually clear stuck loading bars
  try {
      setInterval(function() {
        if($('.progress'))
        $('.progress').fadeOut();
      }, 5000);
  } catch(e) {console.log('failed');}


});

function footerTriggerInit(){
  var footer = $('#footer');
  $('#footer-trigger').hoverIntent({
    over: function(){footer.css('top','0');},
    out: function(){
      footer.css('top', '-40px');
      $('.nav-collapse').collapse('hide');},
    timeout: 1000
  });
//hover(function(){footer.css('top', '0');}, function(){
//    if (!ngw.isFooterScreenOn) {
//      footer.animate({top : '-=40'}, {queue: true});
//      $('.nav-collapse').collapse('hide');
//    }
//  });
}

function closeAll(){
  $("[id$='Screen']").fadeOut();
  $('.nav-collapse').collapse('hide');
  $('[id="alertBox"]').fadeOut();
  $('#footer').removeAttr('style');
  //$('#footer').css('top', '-40px');
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
}

function hideParsingBar(type) {
  if (type == 'success') {
    $('.progress:first').addClass('progress-success').delay(800).fadeOut();
  } else if (type == 'error') {
    $('.progress:first').addClass('progress-danger').delay(800).fadeOut();  
  } else {
    $('.progress:first').delay(800).fadeOut();  
  }
  $('.progress[style="display: none;"]').remove();
    
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
    input.blur();
  }
  else {
    preview.css("opacity", 0);
    preview.css("visibility", "hidden");
    $('body, html').css("background", "");
    $('#markdownMode').removeClass('active');

    ngw.isPreviewOn = false;
    input.focus();
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
      closeAll();
    });
    $('#action').html(actionName).on('click', function(e) {
      action(fileName);
      closeAll();
    });
  } else {
    $('#saveAction, #action').css('visibility', 'hidden');
  }
  $('#closeAlert').on('click', function(e){
    $('[id="alertBox"]').fadeOut();
  });

}
