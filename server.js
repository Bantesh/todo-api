var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db')

var app = express();

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextID = 1;

app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Todo API ROOT');
})

app.get('/todos', function (req, res) {
    var queryParams = req.query;
    var where = {};
    if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
        where.completed = true;
    } else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
        where.completed = false;
    }
    if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
        where.description = {
            $like: '%' + queryParams.q + '%'
        };
    }
    db.todo.findAll({ where: where }).then((todos) => {
        res.json(todos);
    }, (e) => { res.status(500).send() });

});
app.get('/todos/:id', function (req, res) {
    const todoId = parseInt(req.params.id);
    db.todo.findById(todoId).then(function (todo) {
        if (todo) {
            res.json(todo.toJSON());
        } else {
            res.status(404).send("Not found!");
        }
    }, function (e) {
        res.status(500).json(e);
    })
})

// POST

app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0)
        return res.status(400).send();
    body.description = body.description.trim();
    db.todo.create(body).then(function (todo) {
        res.json(todo.toJSON());
    }, function (e) {
        return res.status(400).json(e);
    });


})

// DELETE

app.delete('/todos/:id', function (req, res) {
    const todoId = parseInt(req.params.id);
    db.todo.destroy({
        where: {
            id: todoId
        }
    }).then((rowsDeleted) => {
        if (rowsDeleted === 0) {
            res.status(404).json({
                error: 'No todo with id'
            });
        } else {
            res.status(204).send();
        }
    }, () => {
        res.status(500).send();
    });
});

// PUT

app.put('/todos/:id', (req, res) => {
    const todoId = parseInt(req.params.id);
    var matchedTodo = _.findWhere(todos, {
        id: todoId
    });
    if (!matchedTodo) {
        res.status(404).send('Asking for invalid todo with id of ' + req.params.id);
    }
    var body = _.pick(req.body, 'description', 'completed');
    var validAttributes = {};
    if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
        validAttributes.completed = body.completed
    } else if (body.hasOwnProperty('completed')) {
        return res.status(400).send();
    }
    if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
        validAttributes.description = body.description
    } else if (body.hasOwnProperty('description')) {
        return res.status(400).send();
    }
    _.extend(matchedTodo, validAttributes);
    res.json(matchedTodo);
})
db.sequelize.sync().then(() => {
    app.listen(PORT, function () {
        console.log('Server is running on port ' + PORT);
    });
});
