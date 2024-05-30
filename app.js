const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const path = require('path')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initialiseDBserver = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Server DB Error:${e.message}`)
    process.exit(1)
  }
}
initialiseDBserver()

//dbObjectToresponse conversion

const dbObjectToresponseObject = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  }
}

const checkingInvalidScenarios = async (request, response, next) => {
  const {todoId} = request.params
  const {search_q, category, priority, status, date} = request.query
  //category check
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  //priority check
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)

    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  //status check
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)

    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  //Due date check
  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      console.log(formatedDate)
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      console.log(result)
      console.log(new Date())

      const isValidDate = await isValid(result)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todoId = todoId
  request.search_q = search_q

  next()
}

const checkingRequestBodies = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params
  //category check
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  //priority check
  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)

    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  //status check
  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)

    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  //due date

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate)
      const result = toDate(new Date(formatedDate))
      const isValidDate = isValid(result)
      console.log(isValidDate)
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }
  request.todo = todo
  request.id = id

  request.todoId = todoId

  next()
}

//GET API 1 with 7 scenarios
app.get('/todos/', checkingInvalidScenarios, async (request, response) => {
  const {
    status = '',
    search_q = '',
    priority = '',
    category = '',
  } = request.query
  console.log(status, search_q, priority, category)

  const selectSearchQuery = `
  SELECT *
  FROM 
  todo
  WHERE 
  todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%' AND status LIKE '%${status}%' AND category LIKE '%${category}' ;`

  const todosArray = await db.all(selectSearchQuery)

  response.send(todosArray.map(element => dbObjectToresponseObject(element)))
})

//GET API 2 returns specific todo

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getSelectQuery = `
  SELECT *
  FROM 
  todo
  WHERE 
  id = ${todoId}`
  const dbResponse = await db.get(getSelectQuery)
  response.send(dbObjectToresponseObject(dbResponse))
})

//GET API 3
app.get('/agenda/', checkingInvalidScenarios, async (request, response) => {
  const {date} = request
  console.log(date)

  const selectDuaDateQuery = `
        SELECT
          *
        FROM 
            todo
        WHERE 
            due_date = '${date}'
        ;`

  const dbResponse = await db.all(selectDuaDateQuery)

  if (dbResponse === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(dbResponse.map(element => dbObjectToresponseObject(element)))
  }
})

// API 4 POST
app.post('/todos/', checkingRequestBodies, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const postQuery = `
  INSERT INTO 
  todo(id,todo,priority,status,category,due_date)
  VALUES(
     ${id},
    '${todo}',
    '${priority}',
    '${status}',
    '${category}',
    '${dueDate}');`

  const dbResponse = await db.run(postQuery)
  console.log(dbResponse)
  response.send('Todo Successfully Added')
})

//API 5 PUT

app.put('/todos/:todoId/', checkingRequestBodies, async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body

  let todoUpdateQuery = null

  switch (true) {
    case status !== undefined:
      todoUpdateQuery = `
     UPDATE todo
     SET 
      status = '${status}'
     WHERE 
      id = ${todoId};`
      await db.run(todoUpdateQuery)
      response.send('Status Updated')
      break

    case priority !== undefined:
      todoUpdateQuery = `
     UPDATE todo
     SET 
      priority = '${priority}'
     WHERE 
      id = ${todoId};`
      await db.run(todoUpdateQuery)
      response.send('Priority Updated')
      break

    case todo !== undefined:
      todoUpdateQuery = `
     UPDATE todo
     SET 
      todo = '${todo}'
     WHERE id = ${todoId};`
      await db.run(todoUpdateQuery)
      response.send('Todo Updated')
      break

    case category !== undefined:
      todoUpdateQuery = `
     UPDATE todo
     SET 
      category = '${category}'
     WHERE id = ${todoId};`

      await db.run(todoUpdateQuery)

      response.send('Category Updated')
      break

    case dueDate !== undefined:
      todoUpdateQuery = `
     UPDATE todo 
     SET 
      due_date = '${dueDate}'
     WHERE id = ${todoId};`
      await db.run(todoUpdateQuery)
      response.send('Due Date Updated')
      break
  }
})

//API 6 DELETE

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  DELETE FROM 
  todo 
  WHERE id = ${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
