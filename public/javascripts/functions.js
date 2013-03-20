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
	wikipediaPage === "?" || wikipediaPage === "!")
      {
            return false;
      }

//duckduckgo dictionary definition look up

 if (wikipediaPage.charAt(0) == '?' && wikipediaPage !== '?')
{
	showParsingBar();
   var jqxhr = $.getJSON("http://api.duckduckgo.com/?q=define+" + wikipediaPage.substring(1) + "&format=json&pretty=1&callback=?&", function() {
        
    }).done(function(data) {
	text = data.Abstract;
	console.log(data.Abstract);

	try
	{
         var actval = String(box.val());
          var extratextlen = actval.indexOf("\n", pos) - pos;
          var newval = actval.substring(pos, extratextlen);

          box.val(curval.substring(0, pos) + "\n" + text + "\n" + actval.substring(pos + 1));
          box.scrollTop(9999).focus();

          box.focus();
          var offsetSelect = actval.length - curval.length;
          var selectpos = pos + text.length + 1 + offsetSelect;
          $(box).selectRange(selectpos, selectpos); 
          console.log(text);
          if (text === '')
            hideParsingBar('error');
          else
            hideParsingBar('success');

	}
	catch (err)
	{
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

// wikipedia look up

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

          box.val(curval.substring(0, pos) + "\n" + text + "\n" + actval.substring(pos + 1));
          box.scrollTop(9999).focus();

          box.focus();
          var offsetSelect = actval.length - curval.length;
          var selectpos = pos + text.length + 1 + offsetSelect;
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
    $('#input').val('Using this tool\n ---------------\n \n This page lets you create HTML by entering text in a simple format that\'s easy to read and write.\n \n - Type Markdown text in the left window - See the HTML in the right \n Markdown is a lightweight markup language based on the formatting conventions that people naturally use in email.  As [John Gruber] writes on the [Markdown site] [1]:\n\n > The overriding design goal for Markdown\'s\n > formatting syntax is to make it as readable\n > as possible. The idea is that a\n > Markdown-formatted document should be\n > publishable as-is, as plain text, without\n > looking like it\'s been marked up with tags\n > or formatting instructions.\n \n This document is written in Markdown; you can see the plain-text version on the left.  To get a feel for Markdown\'s syntax, type some text into the left window and watch the results in the right.  You can see a Markdown syntax guide by switching the right-hand window from *Preview* to *Syntax Guide*.\n \n Showdown is a Javascript port of Markdown.  You can get the full [source code] by clicking on the version number at the bottom of the page.\n \n **Start with a [blank page] or edit this document in the left window.**\n \n [john gruber]: http://daringfireball.net/\n [1]: http://daringfireball.net/projects/markdown/\n [source code]: http://www.attacklab.net/showdown-v0.9.zip\n [blank page]: ?blank=1 "Clear all text"\n \n \n ## Syntax highlighting\n \n When combined with [highlight.js][] this starts looking as a kind of IDE :-)\n \n HTML:\n \n \t <h1>HTML code</h1>\n \t <p class="some">This is an example</p>\n \n Python:\n \n \t def func():\n \t for i in [1, 2, 3]:\n \t print "%s" % i\n \n \n [highlight.js]: http://softwaremaniacs.org/soft/highlight/en/\n');
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
