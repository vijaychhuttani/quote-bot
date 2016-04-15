var express = require('express');
var request = require('request');
var cheerio = require('cheerio');
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 3000;
var token = '***REMOVED***'
	+'***REMOVED***'
	+'***REMOVED***';

app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true })); 

//ROUTES
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === '***REMOVED***') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});


app.post('/webhook/', function (req, res) {
	if(typeof req.body !== 'undefined' && req.body !== null){
	  messaging_events = req.body.entry[0].messaging;
	  for (i = 0; i < messaging_events.length; i++) {
	    event = req.body.entry[0].messaging[i];
	    sender = event.sender.id;
	    if (event.message && event.message.text) {
	      keyword = event.message.text;
	      if(keyword !== null && typeof keyword !== 'undefined'){
	      	console.log("Keyword Searched: " + keyword);
	      	getRandomQuote(keyword, function(return_message){
		      sendTextMessage(sender, return_message);
		    });
	      } else {
	      	 sendTextMessage(sender, "Did you enter anything?? Please resend!!");
	      }
	    }
	  }
	} else {
		console.log("Empty request in POST:/webhook");
	}
	res.sendStatus(200);
});


app.get('/init', function(req, res){
	var url = 'https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=' + token;
	request(url, function(error, response, body){
		if(!error){
			res.send(body);
		} else {
			res.send(error);
		}
	});
});


app.get('/quotes/:keyword', function(req, res) {
	if(typeof req.params.keyword !== 'undefined' && null !== req.params.keyword){
		getRandomQuote(req.params.keyword, function(data){
				res.send("<h2>"+data+"</h2>");
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
	if(keyword !== null && typeof keyword !== 'undefined'){
	  keyword = keyword.replace(" ", "+");
	}
	var pageNum = Math.floor(Math.random() * (10)) + 1;
	var url = 'http://www.brainyquote.com/search_results.html?q=' + keyword + '&pg=' + pageNum;
	var quotes = [];
	var authors = [];
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    var $ = cheerio.load(response.body);
	    var j = 0;
		$('.bqQuoteLink').each(function(i, elem) {
			var quote = $(this).find('a').text();
			var author = $(this).parent('.boxyPaddingBig').find('.bq-aut').find('a').text() || 'Unknown';
			if(('"' + quote + '" - ' + author).length <= 320){
				quotes[j] = quote;
				authors[j] = author;
				j++;
			}
		});
		if(quotes.length === 0 || typeof quotes === 'undefined') {
			keyword = keyword.replace("+", " & ");
			callback("Oops!! I do not know any quote having keyword(s) '" 
					+ keyword 
					+ "', Let's try something else!");
		} else {
			var quoteNum = Math.floor(Math.random() * (quotes.length));
			console.log("URL: " + url + " ---> QuoteNumber: " + quoteNum);
			console.log("Quote: " + quotes[quoteNum].replace("  " , " ") + '" - ' + authors[quoteNum]);
			callback('"' + quotes[quoteNum].replace("  " , " ") + '" - ' + authors[quoteNum]);
		}
	  } else {
	  	callback("Error 500 : Some error occured, please try later.");
	  }
	});
}


function sendTextMessage(sender, text) {
  messageData = {
    text:text
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}


