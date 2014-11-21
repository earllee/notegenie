
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

function generalRequest(request, success_callback, box, curval, error_callback) {
  request.error = function(em){
    hideParsingBar('error');
    if (typeof error_callback !== 'undefined')
      error_callback();
  }
  request.success = function(data) {
    try {
      var text = success_callback(data);

      var actval = String(box.val());
      var extratextlen = actval.indexOf("\n", pos) - pos;
      var newval = actval.substring(pos, extratextlen);

      box.val(curval.substring(0, pos) + "\n\n> " + text + "\n\n" + actval.substring(pos + 1));
      var offsetSelect = actval.length - curval.length;
      var selectpos = pos + text.length + 5 + offsetSelect;
      $(box).selectRange(selectpos, selectpos);

      hideParsingBar('success');
    }
    catch (err) {
      var actval = String(box.val());
      box.val(curval.substring(0,pos) + actval.substring(pos));
      var offset = actval.length - curval.length;
      $(box).selectRange(pos +offset,pos+offset);
      hideParsingBar('error');
      if (typeof error_callback !== 'undefined')
        error_callback();
    }
  }

  $.ajax(request);
}

function wikipediaSuccessCallback(json) {
  var text = json.parse.text["*"];
  var n = text.indexOf("/table>");
  while (n != -1) { //Gets rid of pre-content tables
    if (n > -1)
      text = text.substring(n+8);
    n = text.indexOf("/table>");
  }

  text = text.substring(text.indexOf("<p>")+3);
  text = text.substring(0, text.indexOf("</p>"));

  var tags = /(<([^>]+)>)/ig; //Finds all tags
  text = text.replace(tags, "");

  if (text.length > 3 && (text.substring(text.length-3) == "to:"))
     throw "disambiguation";
  if (text.indexOf(" may refer to ") > -1)
  {
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
  return text
}

function wikipediaRequest(searchQuery, box, curval) {
  request = {
      type: 'GET',
      dataType: "json",
      url: '//en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?&redirects=',
      data: {page:searchQuery, uselang:'en'},
      async: false
  }
  generalRequest(request, wikipediaSuccessCallback, box, curval);
}

function ddgSuccessCallback(data) {
  text = data.Abstract;

  if (data.AbstractSource === "Merriam-Webster" && text.indexOf("definition:") > -1)
    text = text.substring(text.indexOf("definition:") + 12);
  else if (data.AbstractSource === "The Free Dictionary" && text.indexOf("\u00b7") > -1) {
    temptext = text.substring(text.lastIndexOf("\u00b7"));
    text = temptext.substring(temptext.indexOf(" ") + 1);
  }

  if (text === "")
    throw "blank page";

  return text;
}

function ddgRequest(searchQuery, box, curval) {
  request = {
    type: 'GET',
    dataType: "json",
    url: '//api.duckduckgo.com/?q=define+' + searchQuery + "&format=json&pretty=1&callback=?&",
    async: false
  }

  // cascade wikipedia lookup if ddg request fails
  var wikipedia_fallback = function() {
    showParsingBar();
    wikipediaRequest(searchQuery, box, curval)
  }

  generalRequest(request, ddgSuccessCallback, box, curval, wikipedia_fallback);
}

function gettyImageSuccessCallback(data) {
  if (data.total_hits < 1)
    throw "no images";

  var image_url = data.image_url;
  return "![" + data.search_term + "](" + image_url + ")"
}

function imgRequest(searchQuery, box, curval) {
  request = {
    type: 'GET',
    dataType: "json",
    url: '/image_search?q=' + searchQuery,
    async: true
  }

  generalRequest(request, gettyImageSuccessCallback, box, curval);
}

function updateBox(wikipediaPage, box, pos, curval) {
  if (wikipediaPage === "" || wikipediaPage === "?" || wikipediaPage === "!")
  return false;

  var numlist_regex = /(^[0-9]+[\.]\ )/;
  var amatch_numlist = numlist_regex.exec(wikipediaPage);

  var hash_regex = /((^[\#]+)|(^[\*]+)|(^[\_]+))/;
  var amatch_hash = hash_regex.exec(wikipediaPage);

  var asterisk_regex = /^[\*]+([^\*]+)[\*]+/;
  var amatch_asterisk = asterisk_regex.exec(wikipediaPage);

  var underscore_regex = /^[\_]+([^\_]+)[\_]+/;
  var amatch_underscore = underscore_regex.exec(wikipediaPage);

  if (amatch_numlist)
    wikipediaPage = wikipediaPage.substring(amatch_numlist[0].length);
  else if (amatch_asterisk)
      wikipediaPage = amatch_asterisk[1];
  else if (amatch_underscore)
      wikipediaPage = amatch_underscore[1];
  else if (/^[\*\-\+]\ /i.test(wikipediaPage))	// handles bullets
      wikipediaPage = wikipediaPage.substring(2); 
  else if (amatch_hash)
      wikipediaPage = wikipediaPage.substring(amatch_hash[0].length);

  // Duckduckgo dictionary definition look up
  if (wikipediaPage.charAt(0) == '?' && wikipediaPage !== '?') {
    showParsingBar();
    ddgRequest(wikipediaPage.substring(1), box, curval)
    return;
  }

  // gettyimage search for queries beginning with "/img "
  if (wikipediaPage.match(/^\/img .+/) != null) {
    showParsingBar();
    searchTerm = wikipediaPage.match(/^\/img .+/)[0].substring(5);
    imgRequest(searchTerm, box, curval);
    return;
  }

    // Wikipedia look up
  showParsingBar();
  wikipediaRequest(wikipediaPage, box, curval);
} // End updateBox
