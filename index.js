const sqlite3 = require("sqlite3");
const express = require("express");
const swagger = require("swagger-ui-express");
const openAPIDocument = require("./openapi.json");

const app = express();
const port = 3000;
const db = new sqlite3.Database("tasks.db");

db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      done INTEGER NOT NULL DEFAULT 0
    )
  `,
    [],
    (err) => {
      if (err) return console.error(err.message);
    },
  );

  db.get("SELECT COUNT(*) AS count FROM tasks", [], (err, row) => {
    if (err) return console.error(err.message);

    if (row.count === 0) {
      db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", [
        "Create a todo-list app",
        1,
      ]);
      db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", [
        "Do laundry",
        0,
      ]);
      db.run("INSERT INTO tasks (title, done) VALUES (?, ?)", ["Breathe", 1]);
    }
  });

  app.listen(port, () => {
    console.log(`app listening on port ${port}`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/docs", swagger.serve, swagger.setup(openAPIDocument));

app.get("/", (req, res) => {
  res
    .status(200)
    .send({ name: "Task API", version: "1.0", endpoints: ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.status(200).send({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, tasks) => {
    if (err) {
      return console.error(err.message);
    }

    if (tasks) {
      for (const task of tasks) {
        task.done = Boolean(task.done);
      }
      res.status(200).send(tasks);
    }
  });
});

app.get("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, task) => {
    if (err) {
      return console.error(err.message);
    }

    if (!task) {
      return res.status(404).send({ error: `Task ${id} not found` });
    }

    task.done = Boolean(task.done);
    res.status(200).send(task);
  });
});

app.post("/tasks", (req, res) => {
  const title = req.body.title;
  if (!title || title == "") {
    return res.status(400).send({ error: `Title is missing` });
  }

  db.run(
    "INSERT INTO tasks (title, done) VALUES (?, ?)",
    [title, 0],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      const task = {
        id: this.lastID,
        title,
        done: false,
      };
      res.status(201).send(task);
    },
  );
});

app.put("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const title = req.body.title;
  const done = req.body.done;

  if (
    (!title && done == undefined) ||
    title == "" ||
    (done != undefined && typeof done !== "boolean")
  ) {
    return res.status(400).send({ error: `Invalid body` });
  }

  db.get("SELECT * FROM tasks WHERE id = ?", [id], (err, task) => {
    if (err) {
      return console.error(err.message);
    }
    if (!task) {
      return res.status(404).send({ error: `Task ${id} not found` });
    }
    const updatedTask = {
      id,
      title: title ?? task.title,
      done: done ?? task.done,
    };
    db.run(
      "UPDATE tasks SET title = ?, done = ? WHERE id = ?",
      [updatedTask.title, updatedTask.done, updatedTask.id],
      function (err) {
        if (err) {
          return console.error(err.message);
        }
        if (this.changes === 0) {
          return res.status(404).send({ error: `Unknown ID` });
        }
        res.status(200).send({ ...updatedTask, done: Boolean(updatedTask.done)  });
      },
    );
  });
});

app.delete("/tasks/:id", (req, res) => {
  const id = parseInt(req.params.id);

  db.run("DELETE FROM tasks WHERE id = ?", [id], function (err) {
    if (err) {
      return console.error(err.message);
    }
    if (this.changes === 0) {
      return res.status(404).send({ error: `Unknown ID` });
    }
    res.sendStatus(204);
  });
});
