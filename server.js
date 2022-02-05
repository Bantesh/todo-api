var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();

var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextID = 1;

app.use(bodyParser.json());
app.get('/', function (req, res) {
    res.send('Todo API ROOT');
})

app.get('/todos', function (req, res) {
    res.json(todos);
})
app.get('/todos/:id', function (req, res) {
    const todoId = parseInt(req.params.id);
    var matchedTodo = _.findWhere(todos, {
        id: todoId
    });
    if (matchedTodo) {
        res.json(matchedTodo);
    } else {

        res.status(404).send('Asking for invalid todo with id of ' + req.params.id);
    }
})
// POST

app.post('/todos', function (req, res) {
    var body = _.pick(req.body, 'description', 'completed');
    if (!_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length === 0)
        return res.status(400).send();
    body.description = body.description.trim();
    body.id = todoNextID;
    todoNextID++;
    todos.push(body);
    console.log("Data: ", body);
    res.json(todos);

})

// DELETE

app.delete('/todos/:id', function (req, res) {
    const todoId = parseInt(req.params.id);
    var matchedTodo = _.findWhere(todos, {
        id: todoId
    });
    if (!matchedTodo) {
        res.status(404).send('Asking for invalid todo with id of ' + req.params.id);
    } else {
        todos = _.without(todos, matchedTodo);
        res.json(matchedTodo);
    }
})

app.listen(PORT, function () {
    console.log('Server is running on port ' + PORT);
})