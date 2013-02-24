function mytext()
{
	this.value = "oldtxt"
}

function textchanger(obj,val)
{
	obj.value = val;
}

function parseTerm(wikipediaPage)
{
	thetext = new mytext();
	sometext = "asdfd";
	sometext = Object(sometext);
$.getJSON('http://en.wikipedia.org/w/api.php?action=parse&format=json&section=0&prop=text&callback=?', {page:wikipediaPage, prop:'text|images', uselang:'en'}, function(json, sometext)
{
 text=json.parse.text["*"];
var n = text.indexOf("</table>");
if (n > -1)
{
	text = text.substring(n+9);
}

text = text.substring(text.indexOf("<p>")+3);
text = text.substring(0, text.indexOf("</p>"));

var regex = /(<([^>]+)>)/ig;

text = text.replace(regex, "");

//text = $(text).text();
textchanger(sometext, text);

$("asdf").show();

});
return sometext.value;
}