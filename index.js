const express = require('express');
const session = require('express-session');
const { executeQuery,login, createBooksTable,createUsersTable, signup, createBook, getBooksByUsername } = require('./db');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
  }));


// middleware for login
const requireLogin = (req, res, next) => {
if (req.session.loggedIn) {
    // User is authenticated, allow access to the route
    next();
} else {
    // User is not authenticated, redirect to login page
    res.redirect('/');
}
};

app.get('/', (req, res) => {
    res.render('index');
  });


app.post('/login', (req, res) => {
const { username, password } = req.body;

    login(username, password)
    .then(() => {
        req.session.loggedIn = true;
        req.session.username = username; // Store username in session for future use
        console.log('Login successful');
        res.redirect('/my-books');
        
    })
    .catch((error) =>{
        console.error('Login failed:', error);
        res.render('index');
    });

console.log('Submitted username:', username);
console.log('Submitted password:', password);
});

app.get('/signup', (req, res) => {
    res.render('signup');
  });

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    
    const status = signup(username, email, password)
    .then(() => {
        console.log('Signup successful');
        res.redirect('/');
    })
    .catch((error) => {
        console.error('Signup failed:', error);
        res.render('signup');
    });
    console.log('Submitted username:', username);
    console.log('Submitted email:', email);
    console.log('Submitted password:', password);
   
  });

  app.get('/my-books',requireLogin, (req, res) => {
    getBooksByUsername(req.session.username)
    .then((books) => {
        res.render('mybooks', { session: req.session, books });
    })
    .catch((error) =>{
        console.error('Retrieving books from db failed:', error);
        res.redirect('/');
    });
  });

  app.get('/logout', (req, res) => {
    // Clear session data
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        res.status(500).send('Internal Server Error');
        return;
      }
      // Redirect to the login page or any other page after logout
      res.redirect('/');
    });
  });

app.get('/create-my-book',requireLogin, (req, res) => {
    res.render('createbooks', { session: req.session });
  });

app.post('/create-my-books', (req, res) => {
    const { name } = req.body;
    const createdby = req.session.username;
    console.log(req.session)
    const status = createBook(name, createdby)
    .then(() => {
        console.log('My books created successful');
        res.redirect('/my-books');
    })
    .catch((error) => {
        console.error('My books created failed:', error);
        res.redirect('/my-books');
    });
    
   
  });

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    // createUsersTable();         //for first time only
    // createBooksTable();         //for first time only
    console.log(`Server is running on port ${port}`);
});

