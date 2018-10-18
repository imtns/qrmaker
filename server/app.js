let express = require('express');
let bodyParser = require('body-parser');
let router = require('./router/router');
const cors = require('cors');
let port = process.env.PORT || 9999;
let app = express();
app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

app.use(router);

app.listen(port, () => {
    console.log(`devServer start on port:${ port}`);
});