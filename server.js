var express = require('express');
var app = express();

var PORT = process.env.PORT || 3000;

var todos = [{
    id: 1,
    description: 'Meet mom for lunch',
    completed: false
}, {
    id: 2,
    description: 'Go to market',
    completed: false
}, {
    id: 3,
    description: 'Feed the cat',
    completed: true
}];
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

app.listen(PORT, function () {
    console.log('Server is running on port ' + PORT);
})