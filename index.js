/*const express = require('express');
const app = express();
require('./database');
const path = require('path');

// SETTINGS
app.set('port', process.env.PORT || 3005)

// STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// STARTING SERVER
const server = app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
})

// WEBSOCKETS
const SocketIO = require('socket.io');
const io = SocketIO(server);

//require('./socketsInterno')(io);
io.sockets.on('connection', function (socket) {
    console.log('socket connected');

    socket.on('disconnect', function () {
        console.log('socket disconnected');
    });

    socket.emit('text', 'wow. such event. very real time.');
});



io.on('connection', (socket) => {
    console.log('NEW CONNECTION:', socket.id);
})


*/

const express = require('express');
const app = express();
require('./database');
const path = require('path');
const exphbs = require('express-handlebars');

// SETTINGS
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({

    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs'

}));

app.set('view engine', '.hbs');

// ROUTES

app.use(require('./routes/index'));

// STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));

// STARTING SERVER
const server = app.listen(app.get('port'), () => {
    console.log('Server on port', app.get('port'));
})

const socketIO = require('socket.io');
const io = socketIO(server);

require('./socketsInterno')(io);

io.sockets.on('connection', function (socket) {
    console.log('-> Client connected');

    var UserID;
    var Old_FieldContent = "";

    socket.on('userid', function (data) {
        if (data.id) {
            console.log('userid');
            UserID = data.id;
            console.log(UserID);
            //StartGetting_Filename(UserID);
        }
    })

    socket.on('disconnect', () => console.log('Client disconnected'));
});