// This file contains general helper functions that are not specific to NoteGenie.
(function($) {
  // From http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values
  // Returns value of URL query parameter
  $.getURLParam = (function(a) {
    if (a === "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i)
    {
      var p=a[i].split('=');
      if (p.length != 2) continue;
      b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
  })(window.location.search.substr(1).split('&'));

})(jQuery);

function hash(s) {
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a;},0);
}

// Returns true or false depending on if the two input texts are the same
// Note: get_bool is a new function added to the difflib js library.
function diff(a, b) {
  var sm = new difflib.SequenceMatcher(a, b);
  return sm.get_bool();
}
