const express = require("express");
const app = express();
const port = 3000;

tasks = [
  { id: 1, title: "Create a todo-list app", done: true },
  { id: 2, title: "Do laundry", done: false },
  { id: 3, title: "Breathe", done: true },
];

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
    return res.status(404).send("Not found!");
  }
  res.status(200).send(task);
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
