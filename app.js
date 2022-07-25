const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
//const bcrypt = require("bcrypt");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasStatusAndPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined &&
    requestQuery.priority !== undefined &&
    requestQuery.category !== undefined
  );
};
const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasStatusAndCategory = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
};
const hasPriorityAndCategory = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const authenticateStatusQuery = (request, response, next) => {
  const { status } = request.query;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      next();
      console.log(1);
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    next();
  }
};
const authenticatePriorityQuery = (request, response, next) => {
  const { priority } = request.query;
  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "LOW" || priority === "MEDIUM") {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else {
    next();
  }
};
const authenticateCategoryQuery = (request, response, next) => {
  const { category } = request.query;
  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else {
    next();
  }
};

app.get(
  "/todos/",
  authenticateStatusQuery,
  authenticatePriorityQuery,
  authenticateCategoryQuery,
  async (request, response) => {
    let data = null;
    let getTodosQuery = "";
    const { search_q = "", status, priority, category } = request.query;
    console.log(status);
    console.log(priority);
    console.log(search_q);
    console.log(category);
    switch (true) {
      case hasStatusAndPriorityAndCategory(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}'
          AND category = '${category}';`;
        break;
      case hasStatusAndPriority(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND priority = '${priority}';`;
        break;
      case hasStatusAndCategory(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND category = '${category}';`;
        break;
      case hasPriorityAndCategory(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND priority = '${priority}'
          AND category = '${category}';`;
        break;
      case hasStatus(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND status = '${status}';`;
        break;

      case hasPriority(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND priority = '${priority}';`;
        break;
      case hasCategory(request.query):
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%'
          AND category = '${category}';`;
        break;
      default:
        getTodosQuery = `
          SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}%';`;
        break;
    }

    data = await db.all(getTodosQuery);
    console.log(data);
    response.send(
      data.map((dataItem) => {
        return {
          id: dataItem.id,
          todo: dataItem.todo,
          priority: dataItem.priority,
          status: dataItem.status,
          category: dataItem.category,
          dueDate: dataItem.due_date,
        };
      })
    );
  }
);

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT * FROM todo
    WHERE id = ${todoId};`;
  const todoItem = await db.get(getTodoQuery);
  response.send({
    id: todoItem.id,
    todo: todoItem.todo,
    priority: todoItem.priority,
    status: todoItem.status,
    category: todoItem.category,
    dueDate: todoItem.due_date,
  });
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(date);
  if (isValid(new Date(date))) {
    const formattedDate = format(new Date(date), "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM
        TODO WHERE due_date = '${formattedDate}';`;
    const getTodo = await db.all(getTodoQuery);
    response.send(
      getTodo.map((dataItem) => {
        return {
          id: dataItem.id,
          todo: dataItem.todo,
          priority: dataItem.priority,
          status: dataItem.status,
          category: dataItem.category,
          dueDate: dataItem.due_date,
        };
      })
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

const authenticatePostQuery = (request, response, next) => {
  const { status, priority, category, dueDate } = request.body;
  if (status !== "TO DO" && status !== "IN PROGRESS" && status !== "DONE") {
    response.status(400);
    response.send("Invalid Todo Status");
  } else {
    if (priority !== "HIGH" && priority !== "LOW" && priority !== "HIGH") {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      if (
        category !== "WORK" &&
        category !== "HOME" &&
        category !== "LEARNING"
      ) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        //console.log(testDate);
        //console.log(isValid(testDate));
        if (isValid(new Date(dueDate)) !== true) {
          response.status(400);
          response.send("Invalid Due Date");
        } else {
          next();
        }
      }
    }
  }
  //const dateItems = dueDate.split("-");
  //console.log(dateItems);
  //console.log(isValid(new Date(dueDate)));
};

app.post("/todos/", authenticatePostQuery, async (request, response) => {
  const { id, todo, status, priority, category, dueDate } = request.body;
  console.log(dueDate);
  const newDate = format(new Date(dueDate), "yyyy-MM-dd");
  const postTodoQuery = `INSERT INTO 
    TODO(id,todo,priority,status,category,due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${newDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

const authenticateUpdateQuery = (request, response, next) => {
  const { status, priority, category, dueDate, todo } = request.body;
  console.log(status);
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (priority !== undefined) {
    if (priority === "HIGH" || priority === "LOW" || priority === "HIGH") {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      next();
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  if (dueDate !== undefined) {
    if (isValid(new Date(dueDate)) !== true) {
      response.status(400);
      response.send("Invalid Due Date");
    } else {
      next();
    }
  }
  if (todo !== undefined) {
    next();
  }
};

app.put(
  "/todos/:todoId/",
  authenticateUpdateQuery,
  async (request, response) => {
    const { todoId } = request.params;
    const requestBody = request.body;
    let updatedColumn = "";
    switch (true) {
      case requestBody.status !== undefined:
        updatedColumn = "Status";
        break;
      case requestBody.priority !== undefined:
        updatedColumn = "Priority";
        break;
      case requestBody.category !== undefined:
        updatedColumn = "Category";
        break;
      case requestBody.todo !== undefined:
        updatedColumn = "Todo";
        break;
      case requestBody.dueDate !== undefined:
        updatedColumn = "Due Date";
        break;
    }
    const prevTodoQuery = `
  SELECT * FROM todo WHERE id = ${todoId};`;
    const prevTodo = await db.get(prevTodoQuery);
    const {
      status = prevTodo.status,
      priority = prevTodo.priority,
      category = prevTodo.category,
      todo = prevTodo.todo,
      dueDate = prevTodo.due_date,
    } = request.body;
    const newDate = format(new Date(dueDate), "yyyy-MM-dd");
    const updateTodo = `UPDATE todo 
  SET status = '${status}',
  priority = '${priority}',
  category = '${category}',
  todo = '${todo}',
  due_date = '${newDate}'
  WHERE id = ${todoId};`;
    await db.run(updateTodo);
    response.send(`${updatedColumn} Updated`);
  }
);

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE from todo where id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
