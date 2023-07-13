

if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const mongoose = require('mongoose')
mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', error => console.error(error))
db.once('open', () => console.log('Connected to Mongoose'))

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// app.set('layout', 'layouts/layout');
// app.use(expressLayouts);
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: false }))

app.listen(process.env.PORT || 3000);

const indexRouter = require('./routes/index');
app.use('/', indexRouter);

const adminRouter = require('./routes/admin');
app.use('/admin', adminRouter);

const operatorRouter = require('./routes/operator');
app.use('/operator', operatorRouter);

const angajatRouter = require('./routes/angajat');
app.use('/angajat', angajatRouter);