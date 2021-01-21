const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://kevicii:1234@testzigmap-ix2et.mongodb.net/subasta?retryWrites=true&w=majority', {
    useCreateIndex: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})
    .then(db => console.log('DB is connected'))
    .catch(err => console.error(err));