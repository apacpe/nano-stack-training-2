# Node.js Web Application - Part 2
This is a continuation from [this guide](https://github.com/JasLinnie/nano-stack-training-1). Before you start on this, your application should have at least one page with a HTML form and a POST route that handles the submission of the form.  

In this guide, we will be achieving these 2 items:
1. Connect a database to the application to store form submissions  
2. Incorporate [HubSpot forms API v2](https://developers.hubspot.com/docs/methods/forms/submit_form)

## Pre-requisites
We will be using MongoDB as the database. You will need to create an account with a service such as [mongoDB Atlas](https://www.mongodb.com/cloud/atlas?jmp=homepage), which is a cloud service that hosts MongoDB databases. Once the account is created, do the following:
1. Create a new cluster and choose the free cluster specifications
2. Give a name to the cluster and create it
3. Once done, click into the cluster and click Connect 
4. Add your IP address to the whitelist and create a database user

## Connect database to the app
1. Install MongoDB on your application using `npm install mongodb --save`
2. In the cluster you created in Atlas, click on Connect 
3. Under 'Choose a connection method' step, click 'Connect your application'
4. Copy the url provided there i.e. `mongodb+srv://<user>:<password>@cluster0-z8jcr.mongodb.net/test?retryWrites=true&w=majority` and substitute the user and password with the user and password you set for the database user
5. In your app.js file, add the following codes where you should substitute with your cluster url and shift the app.listen into the connect method:
```
const MongoClient = require('mongodb').MongoClient;

const CONNECTION_URL = "mongodb+srv://<user>:<password>@cluster0-z8jcr.mongodb.net/test?retryWrites=true&w=majority";
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
```

## Store form submission data into MongoDB
1. For the POST route of your app.js file which is used to handle your form submission, add the following codes:
```
app.post('/submit', (req, res) => {
  collection.insertOne(req.body, (err, result) => {  
    if (err) return console.log(err)

    console.log('saved to database')
    res.redirect('/') // or do something else here
  })
})
```
2. Add this code in your app.js file as well to url encode form submission data:
```
app.use(express.urlencoded({ extended: true }));
```

3. Test it out by submitting the form and you should see the data in a database called 'newdb' and within it a collection called 'newcollection' in your Atlas cluster's Collections tab

## Submit form to HubSpot via API
1. Install the following node modules:
```
npm install querystring
npm install cookie-parser
```
2. Add the following node modules and middleware in your app.js file:
```
const https = require('https');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

```
3. In the same POST route we worked on, add the following codes and substitute the endpoint url with your HubSpot portal's ID and form GUID:
```
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
		path: '/uploads/form/v2/:portalId/:formGuid',
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
 
})
```
4. Test it out by submitting the form on your app again, and you should see the submission stored in MongoDB as well as appearing in the HubSpot form's submission page
