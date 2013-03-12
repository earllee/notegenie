$(document).ready(function() {

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
			url: 'http://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?&redirects=', 
			data: {page:wikipediaPage, uselang:'en'}, 
			async: false, 
			success: function(json,wikipediaPage) {
				try {
					var text = json.parse.text["*"];
					var n = text.indexOf("/table>");
					while (n != -1)	{	//Gets rid of pre-content tables	
						if (n > -1) {
							text = text.substring(n+8);
						}
						n = text.indexOf("/table>");
					}

					text = text.substring(text.indexOf("<p>")+3);
					text = text.substring(0, text.indexOf("</p>"));

					var tags = /(<([^>]+)>)/ig;	//Finds all tags
					text = text.replace(tags, "");

					if (text.length > 3 && (text.substring(text.length-3) == "to:")) {
						throw "disambiguation";
					}
					
					var citations = /(\[([^\]]+)\])/ig;	//Finds bracketed citations
					text = text.replace(citations, "");

					text = text.replace(/&#160;/g, "");	//Remove symbol

					if (text.indexOf("Cite error:") > -1)
						text = text.substring(0, text.indexOf("Cite error:"));

					firstParen = text.substring(0,15).indexOf("(");
						//15 is an arbitrary choice, but it's to prevent all parenthetical content from being deleted

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

					text = text.replace(/^\s+|\s+$/g,'');	//trim
					if (text === "")
						throw "blank page";

					var actval = String(box.val());
					var extratextlen = actval.indexOf("\n", pos) - pos;
					var newval = actval.substring(pos, extratextlen);
				//	var newval = actval.substring(actval.indexOf(curval) + curval.length);

					box.val(curval.substring(0, pos) + "\n" + text + "\n" + actval.substring(pos + 1));
				//	box.val(curval + "\n" + text + newval);
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
			}	//End success function

		});	//End AJAX
	}	//End updateBox
	
	var down = 0;	// For slightly better responsiveness.

	$('#input').on("keypress", function(e) {
		if (e.keyCode == 13 && !down) {
			down = 1;
			var value = $(this).val();
			pos = $(this).prop('selectionStart');	//Cursor position
			var endLine = value.substring(0, pos).lastIndexOf("\n");
			if (endLine == -1)
				endLine = value.lastIndexOf("\n");
			$(this).val(value.substring(0, pos) + "\n" + value.substring(pos));
			$(this).selectRange(pos + 1, pos+1);
			
			updateBox(value.substring(endLine+1,pos), $(this), pos, value);
		//	var lastline = value.lastIndexOf("\n");
		//	$(this).val(value + "\n");
		//	updateBox(value.substring(lastline+1,pos), $(this), pos, value);

			down = 0;
			return false; // prevent the button click from happening
		}
	});

});
