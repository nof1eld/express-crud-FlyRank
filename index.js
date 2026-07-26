const express = require("express");
const app = express();
const port = 3000;

tasks = [
  { id: 1, title: "Create a todo-list app", done: true },
  { id: 2, title: "Do laundry", done: false },
  { id: 3, title: "Breathe", done: true },
];

app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.get("/", (req, res) => {
  res.status(200).send({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  res.status(200).send(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return res.status(404).send({ error: `Task ${id} not found`});
  }
  res.status(200).send(task);
});

app.post("/tasks", (req, res) => {
  const title = req.body.title;
  if (!title || title == "") {
    return res.status(400).send({ error: `Title is missing`});
  }

  const MaxId = Math.max(...tasks.map(task => task.id));
  const id = MaxId + 1;

  const task = {
    id,
    title,
    done: false
  };
  tasks.push(task);
  res.status(201).send(task);
});

app.put("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const title = req.body.title;
  const done = req.body.done;

  if ((!title && done == undefined) || title == "") {
    return res.status(400).send({ error: `Invalid body`});
  }
 
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) {
    return res.status(404).send({ error: `Unknown ID`});
  }
  const existingTask = tasks[index]
  const updatedTask = {
    ...existingTask,
    ...(title !== undefined && { title }),
    ...(done !== undefined && { done }),
  };

  tasks[index] = updatedTask;
  res.status(201).send(updatedTask);
});

app.delete("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
 
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) {
    return res.status(404).send({ error: `Unknown ID`});
  }

  tasks.splice(index, 1);
  res.sendStatus(204);
});


app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
