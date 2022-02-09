var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var bcrypt = require('bcrypt');
var db = require('./db');
const { use } = require('bcrypt/promises');
const middleware = require('./middleware')(db);

var app = express();

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextID = 1;

app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Todo API ROOT');
});

app.get('/todos', middleware.requireAuthentication, function (req, res) {
    var queryParams = req.query;
    var where = {
        userId: req.user.get('id'),
    };
    if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
        where.completed = true;
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
        where.completed = false;
    }
    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        where.description = {
            $like: '%' + queryParams.q + '%',
        };
    }
    db.todo.findAll({ where: where }).then(
        (todos) => {
            res.json(todos);
        },
        (e) => {
            res.status(500).send();
        },
    );
});
app.get('/todos/:id', middleware.requireAuthentication, function (req, res) {
    const todoId = parseInt(req.params.id);
    db.todo
        .findOne({
            where: {
                id: todoId,
                userId: req.user.get('id'),
            },
        })
        .then(
            function (todo) {
                if (todo) {
                    res.json(todo.toJSON());
                } else {
                    res.status(404).send('Not found!');
                }
            },
            function (e) {
                res.status(500).json(e);
            },
        );
});

// POST

app.post('/todos', middleware.requireAuthentication, function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0)
        return res.status(400).send();
    body.description = body.description.trim();
    db.todo.create(body).then(
        function (todo) {
            console.log(typeof req.user);
            req.user
                .addTodo(todo)
                .then(function () {
                    return todo.reload();
                })
                .then(function (todo) {
                    res.json(todo.toJSON());
                });
        },
        function (e) {
            return res.status(400).json(e);
        },
    );
});

// DELETE

app.delete('/todos/:id', middleware.requireAuthentication, function (req, res) {
    const todoId = parseInt(req.params.id);
    db.todo
        .destroy({
            where: {
                id: todoId,
                userId: req.user.get('id'),
            },
        })
        .then(
            (rowsDeleted) => {
                if (rowsDeleted === 0) {
                    res.status(404).json({
                        error: 'No todo with id',
                    });
                } else {
                    res.status(204).send();
                }
            },
            () => {
                res.status(500).send();
            },
        );
});

// PUT

app.put('/todos/:id', middleware.requireAuthentication, (req, res) => {
    const todoId = parseInt(req.params.id);
    var body = _.pick(req.body, 'description', 'completed');
    var attributes = {};
    if (body.hasOwnProperty('completed')) {
        attributes.completed = body.completed;
    }
    if (body.hasOwnProperty('description')) {
        attributes.description = body.description;
    }
    db.todo
        .findOne({
            where: {
                id: todoId,
                userId: req.user.get('id'),
            },
        })
        .then(
            function (todo) {
                if (todo) {
                    todo.update(attributes).then(
                        function (todo) {
                            res.json(todo.toJSON());
                        },
                        function (e) {
                            res.status(400).json(e);
                        },
                    );
                } else {
                    res.status(404).send();
                }
            },
            function () {
                res.status(500).send();
            },
        );
});

app.post('/users/login', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    var userInstance;

    db.user
        .authenticate(body)
        .then(function (user) {
            var token = user.generateToken('authentication');
            userInstance = user;
            return db.token.create({
                token: token,
            });
        })
        .then(function (tokenInstance) {
            res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
        })
        .catch(function () {
            return res.status(401).send();
        });
});
app.post('/users', function (req, res) {
    var body = _.pick(req.body, 'email', 'password');
    // body.description = body.password.trim();
    db.user.create(body).then(
        function (user) {
            res.json(user.toPublicJSON());
        },
        function (e) {
            return res.status(400).json(e);
        },
    );
});
//DELETE /users/login
app.delete('/users/login', middleware.requireAuthentication, function (req, res) {
    req.token
        .destroy()
        .then(function () {
            res.status(204).send();
        })
        .catch(function () {
            res.status(500).send();
        });
});

db.sequelize.sync({ force: true }).then(() => {
    app.listen(PORT, function () {
        console.log('Server is running on port ' + PORT);
    });
});
