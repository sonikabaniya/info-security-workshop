const mysql = require('mysql');
const config = require('./config');
const bcrypt = require('bcrypt');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);


// Create a connection pool
const pool = mysql.createPool(config);

const sessionStore = new MySQLStore({
    expiration: 86400000, 
    createDatabaseTable: true, // Automatically create session table if not exists
  }, pool);

// Function to execute SQL queries
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        reject(err);
        return;
      }

      connection.query(query, params, (error, results) => {
        connection.release();
        if (error) {
          reject(error);
          return;
        }
        resolve(results);
      });
    });
  });
}

// Function to create the users table
async function createUsersTable() {
    try {
      await executeQuery(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `);
      console.log('Users table created successfully');
    } catch (error) {
      console.error('Error creating users table:', error);
    }
  }
  
  // Function to create the users table
  async function createBooksTable() {
      try {
        await executeQuery(`
          CREATE TABLE IF NOT EXISTS books (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            createdby VARCHAR(255) NOT NULL
          )
        `);
        console.log('Books table created successfully');
      } catch (error) {
        console.error('Error creating books table:', error);
      }
    }

function login(username, password) {
    return new Promise((resolve, reject) => {
    pool.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) {
          console.error('Error querying database:', error);
          res.send('An error occurred while processing your request');
        } else {
          // Check if a user with the provided username exists
          if (results.length === 1) {
            const user = results[0];
            // Check if the provided password matches the stored password
            bcrypt.compare(password, user.password, (err, result) => {
                if (err) {
                  console.error('Error comparing passwords:', err);
                  return;
                }
                if (result) {
                    resolve(true);
                } else {
                  // Incorrect password
                  console.log('Incorrect password');
                  reject(error);
                }
              });
             } else {
            // User not found
            console.log('User not found');
            reject(error);
          }
        }
      });
    });
}

function signup(username, email, password){
    return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Error hashing password:', err);
          reject(err);
          return;
        }
    
        // Insert user into the database
        pool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (error, results) => {
          if (error) {
            console.error('Error inserting user into database:', error);
            reject(error);
          } else {
            resolve(true);
          }
        });
      });
    });

}

function createBook(bookName, createdBy) {
    return new Promise((resolve, reject) => {
      pool.query('INSERT INTO books (name, createdby) VALUES (?, ?)', [bookName, createdBy], (error, results) => {
        if (error) {
          console.error('Error inserting book into database:', error);
          reject(error);
        } else {
          console.log('Book inserted successfully');
          resolve(true); // Resolve with the ID of the inserted book
        }
      });
    });
  }

  function getBooksByUsername(username) {
    return new Promise((resolve, reject) => {
      pool.query('SELECT * FROM books WHERE createdby = ?', [username], (error, results) => {
        if (error) {
          console.error('Error fetching books:', error);
          reject(error);
        } else {
          console.log('Books fetched successfully');
          resolve(results); // Resolve with the array of books fetched
        }
      });
    });
  }

  function searchBooks(query, user) {
    return new Promise((resolve, reject) => {
      const searchTerm = `%${query}%`; 
  
      pool.query('SELECT * FROM books WHERE name LIKE ? AND createdby = ?', [searchTerm, user], (error, results) => {
        if (error) {
          console.error('Error searching books:', error);
          reject(error);
        } else {
          console.log('Books found successfully');
          resolve(results); // Resolve with the array of matching books
        }
      });
    });
  }

module.exports = {
  executeQuery, login,createUsersTable, createBooksTable, signup, createBook, getBooksByUsername, searchBooks, sessionStore
};
