/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
const axios = require('axios');

//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.
		We'll be using `db` as this is the name of the postgres container in our
		docker-compose.yml file. Docker will translate this into the actual ip of the
		container for us (i.e. can't be access via the Internet).
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab,
		we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database. We set this in the
		docker-compose.yml for now, usually that'd be in a seperate file so you're not pushing your credentials to GitHub :).
**********************/
const dev_dbConfig = {
	host: 'db',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user:  process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};

/** If we're running in production mode (on heroku), the we use DATABASE_URL
 * to connect to Heroku Postgres.
 */
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

// Heroku Postgres patch for v10
// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
  pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

const db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory

app.get('/', function(req,res){
  res.render('pages/main',{
    my_title: "Home page",
    items: '',
    error: false,
    message: ''
  });
});

app.get('/reviews', (req, res) => {
  const review = req.query.review;
  var limitedReviews = `SELECT * FROM reviews WHERE UPPER(brewery_name) LIKE UPPER('%${review}%');`;
  var allReviews = `SELECT * FROM reviews;`;
  db.task('get-everything', task => {
      return task.batch([
          task.any(limitedReviews),
          task.any(allReviews),
      ]);
  }) 
  .then(item => {
    if(item[0] == ''){
      res.render('pages/reviews', {
        my_title: "Reviews",
        reviews: item[1],
        message: '',
        error: false,
    })
  }
    else if(item[0]){
      res.render('pages/reviews', {
          my_title: "Reviews",
          reviews: item[0],
          message: '',
          error: false,
      })
    }
    else{
      res.render('pages/reviews', {
        my_title: "Reviews",
        reviews: item[1],
        message: '',
        error: false,
    })
    }
  })
  .catch(err => {  // query error thrown if backend error occurs 
      console.log(err);
      res.render('pages/reviews', {
          my_title: "Reviews",
          reviews: '',
          message: 'Could not load Reviews',
          error: true,
      });

  })
 });

app.get('/get_feed', function(req, res) {
  var title = req.query.title; 
  if(title) {
    axios({
      url: `https://api.openbrewerydb.org/breweries?by_city=${title}`,
        method: 'GET',
        dataType:'json',
      })
        .then(items => {
          res.render('pages/main', {
            my_title: "Home",
            items: items.data,
            error: false,
            message: ''
          });
        })
        .catch(error => {
          console.log(error);
          res.render('pages/main',{
            my_title: "Home",
            items: '',
            error: true,
            message: error
          })
        });


  }
  else {
      res.render('pages/main',{
        my_title: "Home",
        items: '',
        error: true,
        message: 'error message 2'
      })
  }
});

app.post('/addReview', function(req, res) {
  let preDate = new Date();
  var CurrDate = preDate.toUTCString();
  const breweryName = req.body.breweryName;
  const breweryReview = req.body.breweryReview;
  var insert = `INSERT INTO reviews (brewery_name, review, review_date) VALUES ('${breweryName}','${breweryReview}','${CurrDate}');`;

  db.any(insert)

var allReviews = `SELECT * FROM reviews;`;
db.task('get-everything', task => {
    return task.batch([
        task.any(allReviews),
    ]);
}) 
.then(item => {
  console.log(item[0]);
    res.render('pages/reviews', {
      my_title: "Reviews",
      reviews: item[0],
      message: '',
      error: false,
  });
})
  .catch(error => {
    console.log(error);
    res.render('pages/reviews',{
      my_title: "Reviews",
      reviews: item[0],
      error: true,
      message: error
    })
    });
  });

//app.listen(3000);
const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Express running → PORT ${server.address().port}`);
});