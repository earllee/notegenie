/*
 * jQuery throttle / debounce - v1.1 - 3/7/2010
 * http://benalman.com/projects/jquery-throttle-debounce-plugin/
 * 
 * Copyright (c) 2010 "Cowboy" Ben Alman
 * Dual licensed under the MIT and GPL licenses.
 * http://benalman.com/about/license/
 */
(function(b,c){var $=b.jQuery||b.Cowboy||(b.Cowboy={}),a;$.throttle=a=function(e,f,j,i){var h,d=0;if(typeof f!=="boolean"){i=j;j=f;f=c}function g(){var o=this,m=+new Date()-d,n=arguments;function l(){d=+new Date();j.apply(o,n)}function k(){h=c}if(i&&!h){l()}h&&clearTimeout(h);if(i===c&&m>e){l()}else{if(f!==true){h=setTimeout(i?k:l,i===c?e-m:e)}}}if($.guid){g.guid=j.guid=j.guid||$.guid++}return g};$.debounce=function(d,e,f){return f===c?a(d,e,false):a(d,f,e!==false)}})(this);

jQuery.fn.highlight=function(c){function e(b,c){var d=0;if(3==b.nodeType){var a=b.data.toUpperCase().indexOf(c);if(0<=a){d=document.createElement("span");d.className="highlight";a=b.splitText(a);a.splitText(c.length);var f=a.cloneNode(!0);d.appendChild(f);a.parentNode.replaceChild(d,a);d=1}}else if(1==b.nodeType&&b.childNodes&&!/(script|style)/i.test(b.tagName))for(a=0;a<b.childNodes.length;++a)a+=e(b.childNodes[a],c);return d}return this.length&&c&&c.length?this.each(function(){e(this,c.toUpperCase())}): this};jQuery.fn.removeHighlight=function(){return this.find("span.highlight").each(function(){this.parentNode.firstChild.nodeName;with(this.parentNode)replaceChild(this.firstChild,this),normalize()}).end()};

$(document).ready(function(){ 
  $('#all-courses').load('courses.html');

  $('.dropdown-menu').mouseleave(function(){ $(this).attr('style',''); });

  $('#search').keydown(function(e){ if (e.keyCode == 13) e.preventDefault(); });
  $("#search").keyup($.debounce( 500, function(){

    // Retrieve the input field text and reset the count to zero
    var filter = $(this).val(), count = 0;
    if (!filter) {
      $("*").show();
    }

    var regex = new RegExp(filter, "i"); 
    $(".content, .courses").each(function(){
      // If the list item does not contain the text phrase fade it out
      if ($(this).text().search(regex) < 0) { 
        $(this).css('display','none');//fadeOut();
      } else {
        // Show the list item if the phrase matches and increase the count by 1
        $(this).css('display','');//fadeIn();
      }
    });
    // Loop through the comment list
    $(".courseblock").each(function(){
      // If the list item does not contain the text phrase fade it out
      if ($(this).text().search(regex) < 0) { 
        $(this).css('display','none');//fadeOut();
        header = $(this).parent().prev();
        if (header.is('h3')) {
          header.css('display','none');
        }
      } else {
        // Show the list item if the phrase matches and increase the count by 1
        $(this).css('display','');//fadeIn();
      }
    });

        $('body').highlight($.trim(filter));

  }));
});

