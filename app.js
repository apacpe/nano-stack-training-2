const express = require('express');
const https = require('https');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();
const port = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

const CONNECTION_URL = "mongodb+srv://jasUser:password6!@cluster0-z8jcr.mongodb.net/test?retryWrites=true&w=majority";
const DATABASE_NAME = "newdb"; // you can change the database name
var database, collection;

MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
  if(error) throw error;

  database = client.db(DATABASE_NAME);
  collection = database.collection("newcollection"); // you can change the collection name

  // Start the application after the database connection is ready
  app.listen(port, () => {
    console.log('This app is running on port ' + port)
  });
});



app.get("/", (req, res) => {
  res.render('home');
});

app.post('/submit', (req, res) => {
  collection.insertOne(req.body, (err, result) => {  
    if (err) return console.log(err)

    console.log('saved to database')
  })

	var postData = querystring.stringify({
		    'firstname': req.body.firstname,
		    'email': req.body.email,
		    'message': req.body.enquiry,
		    'hs_context': JSON.stringify({
		        "hutk": req.cookies.hubspotutk,
		        "ipAddress": req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		        "pageUrl": "http://www.portfolio.com/contact",
		        "pageName": "Portfolio contact me"
		    })
		});

// set the post options, changing out the HUB ID and FORM GUID variables.

	var options = {
		hostname: 'forms.hubspot.com',
		path: '/uploads/form/v2/3787161/b2d343f9-9423-4aa6-995a-722d87905fbc',
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length
		}
	}

// set up the request

	var request = https.request(options, function(response){
		console.log("Status: " + response.statusCode);
		console.log("Headers: " + JSON.stringify(response.headers));
		response.setEncoding('utf8');
		response.on('data', function(chunk){
			console.log('Body: ' + chunk)
		});
	});

	request.on('error', function(e){
		console.log("Problem with request " + e.message)
	});

// post the data

	request.write(postData);
	request.end();
  
  res.redirect('/'); // or do something else here 
});
