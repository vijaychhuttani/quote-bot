var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var app = express();
var PORT = process.env.PORT || 3000;

//ROUTES

app.get('/webhook/', function (req, res) {
  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;
    if (event.message && event.message.text) {
      text = event.message.text;
      console.log(text);
    }
  }
  res.sendStatus(200);
});

app.get('/quotes/:keyword', function(req, res) {
	if(typeof req.params.keyword !== 'undefined' && null !== req.params.keyword){
		getRandomQuote(req.params.keyword, function(data){
			if(data !== '404') {
				res.status(200).send(data);
			} else {
				res.send("Oops!! I do not know any quote having keyword(s) '" 
					+ req.params.keyword 
					+ "', Let's try something else!");
			}
			
		});
	} else {
		res.send("Invalid Keyword");
	}
});

//SETTING STATIC SITE AND STARTING SERVER
app.use(express.static(__dirname + '/public'));

app.listen(PORT, function() {
	console.log('Server started at port ' + PORT);
});

//UTILITY FUNCTIONS

function getRandomQuote(keyword, callback) {
	var pageNum = Math.floor(Math.random() * (10)) + 1;
	var url = 'http://www.brainyquote.com/search_results.html?q=' + keyword + '&pg=' + pageNum;
	var quotes = [];
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var $ = cheerio.load(response.body);
		$('.bqQuoteLink').each(function(i, elem) {
			quotes[i] = $(this).find('a').text();
		});
		if(quotes.length === 0) {
			callback("404");
		}
		var quoteNum = Math.floor(Math.random() * (quotes.length));
		console.log("URL: " + url + " ---> QuoteNumber: " + quoteNum);
		console.log("Quote: " + quotes[quoteNum]);
		callback(quotes[quoteNum]);
	  } else {
	  	callback("Error 500 : Some error occured, please try later.");
	  }
	});
}


