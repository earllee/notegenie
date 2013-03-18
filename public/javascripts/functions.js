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
    var req1 = $.ajax({ 
      type: 'GET', 
      dataType: "json", 
      url: '//en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?&redirects=', 
      data: {page:wikipediaPage, uselang:'en'}, 
      async: false, 
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
        }
        catch (err) {
          var actval = String(box.val());
          box.val(curval.substring(0,pos) + actval.substring(pos));
          var offset = actval.length - curval.length;
          $(box).selectRange(pos +offset,pos+offset);
        }
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
  
  //Markdown preview
  $(document).on("keydown", function(e) {
    if (e.keyCode == 77 && e.ctrlKey) {
      //Handle Ctrl+m
      var preview = $('#preview');
      if(!ngw.isPreviewOn) {
        var tokens = marked.lexer(input.val());
        preview.html(marked.parser(tokens));
        preview.css("opacity", 1);
        preview.css("visibility", "visible");
        $('body, html').css("background","white");
        ngw.isPreviewOn = true;
        input.blur();
      }
      else {
        preview.css("opacity", 0);
        preview.css("visibility", "hidden");
        $('body, html').css("background", "");

        ngw.isPreviewOn = false;
        input.focus();
      }

      e.preventDefault();
      return false;
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
    
      updateBox(value.substring(endLine+1,pos), $(this), pos, value);
      return false; // prevent the button click from happening
    } 
  });

  //Change fonts
  $('.font-btn').on("click", function(e) {
    $('.text').css("font-family", $(this).data('font'));
    localStorage["font"] = $(this).data('font');
  });

  //Change font size
  $('#font-size').on("change", function(e) {
    $('.text').css("font-size", $(this).val() + "px");
    localStorage["fontSize"] = $(this).val();
    e.preventDefault();
    return false;
  });

  //Logo Tooltip
  $('.brand').tooltip({trigger: 'hover', delay: {hide: 1000}, placement: 'top'});

  // Footer Screen Mode
  $("[id$='Screen']").fadeOut();
  $('.footerScreenTrigger').on('click', function(e){
    ngw.screen = e.target.dataset.target; // Screen to be opened
    if (!ngw.isFooterScreenOn) {
      ngw.isFooterScreenOn = true;
      ngw.openScreen = ngw.screen;
      $('#footer').css('height', '100%');
      $('#' + ngw.screen).fadeIn();
      $('#closeScreen').fadeIn();
    } else if (ngw.screen === ngw.openScreen){
      closeAll();
    } else {
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


});

function footerTriggerInit(){
  var footer = $('#footer');
  $('#footer-trigger').hover(function(){footer.css('top', '0');}, function(){
    if (!ngw.isFooterScreenOn) {
      footer.css('top', '-40px');
      $('.nav-collapse').collapse('hide');
    }
  });
}

function closeAll(){
  $("[id$='Screen']").fadeOut();
  $('.nav-collapse').collapse('hide');
  $('[id="saveAlert"]').removeAttr('style');
  $('#footer').removeAttr('style');
  $('#footer').css('top', '-40px');
  ngw.screen = ngw.openScreen = 'none';
  ngw.isFooterScreenOn = false;
  console.log(ngw.isFooterScreenOn);
  footerTriggerInit();
  }
