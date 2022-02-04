var express = require('express');
var bodyParser = require('body-parser');

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
    var matchedTodo;
    todos.forEach(function (todo) {
        if (todoId === todo.id) {
            matchedTodo = todo;
        }
    })
    if (matchedTodo) {
        res.json(matchedTodo);
    } else {

        res.status(404).send('Asking for invalid todo with id of ' + req.params.id);
    }
})
// POST

app.post('/todos', function (req, res) {
    var body = req.body;
    body.id = todoNextID;
    todoNextID++;
    todos.push(body);
    console.log("Data: ", body);
    res.json(todos);

})

app.listen(PORT, function () {
    console.log('Server is running on port ' + PORT);
})