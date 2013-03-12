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



function updateBox(wikipediaPage, box, pos, curval)
{
	var req1 = $.ajax(
		{ type: 'GET', dataType: "json", url:'http://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?&redirects=', data:{page:wikipediaPage, uselang:'en'}, async: false, success:function(json,wikipediaPage)
		{
			try
			{
				var text=json.parse.text["*"];
				var n = text.indexOf("/table>");
				while (n != -1)
				{
					if (n > -1)
					{
						text = text.substring(n+8);
					}
					n = text.indexOf("/table>");
				}

				text = text.substring(text.indexOf("<p>")+3);
				text = text.substring(0, text.indexOf("</p>"));

				var regex = /(<([^>]+)>)/ig;

				text = text.replace(regex, "");

				var regex2 = /(\[([^\]]+)\])/ig;

				if (text.length > 3 && (text.substring(text.length-3) == "to:"))
				{throw "disambiguation";}

				text = text.replace(regex2, "");
				text = text.replace(/&#160;/g, "");	
				if (text.indexOf("Cite error:") > -1)
				text = text.substring(0, text.indexOf("Cite error:"));
				par1 = text.substring(0,10).indexOf("(");
				//alert(text)
				//console.log(text);
				text.strip;
				text = text.replace(/^\s+|\s+$/g,'');	//trim
				if (text == "")
					throw "blank page";
				console.log(text);

				var actval = String(box.val());
				var extratextlen = actval.indexOf("\n", pos) - pos;
				var newval = actval.substring(pos, extratextlen);
				//actval = actval.subString(actval.indexOf(curval) + curval.length() + 1);    

		
				box.val(curval.substring(0, pos) + "\n" + text + "\n" + actval.substring(pos + 1));
				box.scrollTop(9999).focus();

				//alert(wikipediaPage + text);

				//box.trigger({type: 'keypress', which: 35});
				box.focus();
				var offsetSelect = actval.length - curval.length;
				console.log(offsetSelect);
				var selectpos = pos + text.length + 1 + offsetSelect;
				$(box).selectRange(selectpos, selectpos);	
				//box.setSelectionRange(pos,pos);
				//setCaretToPos(box,pos);

			}
			catch (err)
			{
				console.log("IN HERE");	
				var actval = String(box.val());
				box.val(curval.substring(0,pos) + actval.substring(pos));
				$(box).selectRange(pos+1 ,pos+1);
			}
		}

	}

);
}


// For slightly better responsiveness.
var down = 0;

$('#input').on("keypress", function(e) {
		//window.scrollTo(0, document.body.scrollHeight);
	if (e.keyCode == 13 && !down) {
		down = 1;
		var value   = $(this).val();
		pos     = $(this).prop('selectionStart');        // cursor position
		//$(this).val(value.substring(0,pos) + "HELLO" + value.substring(pos));
		var endLine = value.substring(0, pos).lastIndexOf("\n");
		if (endLine == -1)
			endLine = value.lastIndexOf("\n");
//var lastline = value.lastIndexOf("\n");
		$(this).val(value.substring(0, pos) + "\n" + value.substring(pos));
		$(this).selectRange(pos + 1, pos+1);
		
		console.log(value.substring(endLine+1, pos));
		updateBox(value.substring(endLine+1,pos), $(this), pos, value);


		//$(this).scrollTop(1);
		//  alert(value);
		//alert (pos);
		
		//window.scrollTo(0, document.body.scrollHeight);
		down = 0;
		return false; // prevent the button click from happening
	}
});


});