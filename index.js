var express = require('express')
var app = express()

var fs = require('fs')
var path = require('path')
var _ = require('lodash')
var engines = require('consolidate')

var JSONStream = require('JSONStream')

var helpers = require('./helpers/helpers')

var bodyParser = require('body-parser')

app.engine('hbs', engines.handlebars)

app.set('views', './views')
app.set('view engine', 'hbs')

app.use(express.static('images'))
app.use(bodyParser.urlencoded({ extended: true }))




app.get('/', function(req, res) {
    var users = []

    fs.readdir('users', function (err, files) {
        if (err) throw err

        files.forEach(function(file) {
            fs.readFile(path.join(__dirname, 'users', file), {encoding: 'utf8'}, function(err, data) {
                if (err) throw err
                var user = JSON.parse(data)
                user.name.full = _.startCase(user.name.first + ' ' + user.name.last)
                users.push(user)
                if (users.length === files.length) res.render('index', {users: users})
            })
        })
    })
})


//---------- Особые пользователи, Закачка json, для API, ошибки имени
app.get(/l.*/, function(req, res, next) {
    console.log('L USER ACCESS')
    next()
})

app.get('*.json', function(req, res) {
    res.download('./users/' + req.path)
})

app.get('/data/:username', function(req, res) {
    var username = req.params.username
    var readable = fs.createReadStream('./users/' + username + '.json')
    readable.pipe(res)
})

app.get('/users/by/:gender', function(req, res) {
    var gender = req.params.gender
    var readable = fs.createReadStream('users.json')

    readable
        .pipe(JSONStream.parse('*', function(user) {
            if (user.gender === gender) return user.name
        }))
        .pipe(JSONStream.stringify('[\n  ', ',\n  ', '\n]\n'))
        .pipe(res)
})

app.get('/error/:username', function(req, res) {
    res.status(404).send('No user named ' + req.params.username + ' found')
})
//---------- Особые пользователи, Закачка json, для API


var userRouter = require('./username')
app.use('/:username', userRouter)





var server = app.listen(3000, function() {
    console.log('Server running at http://localhost:' + server.address().port)
})