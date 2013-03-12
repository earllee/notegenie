$(document).ready(function() {

	function updateBox(wikipediaPage, box, pos, curval) {
		var req1 = $.ajax({ 
			type: 'GET', 
			dataType: "json", 
			url: 'http://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?&redirects=', 
			data: {page:wikipediaPage, uselang:'en'}, 
			async: false, 
			success: function(json,wikipediaPage) {
				try {
					var text=json.parse.text["*"];
					var n = text.indexOf("/table>");
					while (n != -1)	{
						if (n > -1) {
							text = text.substring(n+8);
						}
						n = text.indexOf("/table>");
					}

					text = text.substring(text.indexOf("<p>")+3);
					text = text.substring(0, text.indexOf("</p>"));

					var regex = /(<([^>]+)>)/ig;

					text = text.replace(regex, "");

					var regex2 = /(\[([^\]]+)\])/ig;

					if (text.length > 3 && (text.substring(text.length-3) == "to:")) {
						throw "disambiguation";
					}

					text = text.replace(regex2, "");
					text = text.replace(/&#160;/g, "");	
					if (text.indexOf("Cite error:") > -1)
					text = text.substring(0, text.indexOf("Cite error:"));
					par1 = text.substring(0,15).indexOf("(");
					if (par1 > -1)
					{
						var parcount = 1;
						var curpos = par1 + 1;
						while (parcount > 0 && curpos < text.length)
						{
							if (text.charAt(curpos) == ')')
								parcount -= 1;
							if (text.charAt(curpos) == '(')
								parcount += 1;
							curpos += 1;
						}
						text = text.substring(0, par1) + text.substring(curpos+1);
					}

					var actval = String(box.val());
					var newval = actval.substring(actval.indexOf(curval)+curval.length);

					box.val(curval + "\n" + text + newval);
					box.scrollTop(9999).focus();

					box.trigger({type: 'keypress', which: 35});
				}
				catch (err) {
					box.val(curval + "\n");
				}
			}	//End success function

		}

	);	//End AJAX
	}	//End updateBox
	
	var down = 0;	// For slightly better responsiveness.

	$('#input').on("keypress", function(e) {
			//window.scrollTo(0, document.body.scrollHeight);
		if (e.keyCode == 13 && !down) {
			down = 1;
			var value   = $(this).val();
			pos     = $(this).prop('selectionStart');        // cursor position
			//$(this).val(value.substring(0,pos) + "HELLO" + value.substring(pos));
			var lastline = value.lastIndexOf("\n");
			$(this).val(value + "\n");
			updateBox(value.substring(lastline+1,pos), $(this), pos, value);
			//$(this).scrollTop(1);
			//  alert(value);
			//alert (pos);

			//window.scrollTo(0, document.body.scrollHeight);
			down = 0;
			return false; // prevent the button click from happening
		}
	});

});
