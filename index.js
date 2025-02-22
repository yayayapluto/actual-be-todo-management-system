require('dotenv').config();

// Import Module & Declare Variable
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


// Import DB Connection

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var tasksRouter = require('./routes/tasks');
var userTaskRouter = require('./routes/userTask');

// Create Express App
var app = express(); 

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Define Route
// Greeting API
app.use('/', indexRouter);

// Users API
app.use('/users', usersRouter);

// Tasks API
app.use('/tasks', tasksRouter);

// User Task API
app.use('/user-task', userTaskRouter);

// Handle Error
app.use(function(req, res, next) {
  next(createError(404));
// }); [reason: udh ketutup duluan lek, jadinya res nya not defined]

// error 
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// // Set port
// const port = process.env.APP_PORT || 4000;

// console.log(process.env.APP_PORT)

// // Start server
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
// [reason: di bin/www udh run di port yg sama, jadi tak pikir ini gaperlu hihihi]

module.exports = app;
