'use strict';
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();

module.context.use(router);

/* HELLO WORLD */
router.get('/hello-world', function (req, res) {
  res.send('Hello World!');
})
.response(['text/plain'], 'A generic greeting.')
.summary('Generic greeting')
.description('Prints a generic greeting.');


const joi = require('joi');

/* HELLO [INSERT NAME] */
router.get('/hello/:name', function (req, res) {
  res.send(`Hello ${req.pathParams.name}`);
})
.pathParam('name', joi.string().required(), 'Name to greet.')
.response(['text/plain'], 'A personalized greeting.')
.summary('Personalized greeting')
.description('Prints a personalized greeting.');

/* SUM FUNCTION */
router.post('/sum', function (req, res) {
  const values = req.body.values;
  res.send({
    result: values.reduce(function (a, b) {
      return a + b;
    }, 0)
  });
})
.body(joi.object({
  values: joi.array().items(joi.number().required()).required()
}).required(), 'Values to add together.')
.response(joi.object({
  result: joi.number().required()
}).required(), 'Sum of the input values.')
.summary('Add up numbers')
.description('Calculates the sum of an array of number values.');



/* DB INTERACTION */
const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const errors = require('@arangodb').errors;
const todoColl = db._collection('todos');
const DOC_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;


// router.post('/todos', function (req, res) {
//   try {
//     const data = db._query(aql`
//       UPSERT ${{text: req.body.text}}
//       INSERT ${req.body}
//       UPDATE {}
//       IN ${todoColl}
//       RETURN NEW
//     `);
//     res.send(data)
//   } catch (e) {
//     if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
//       throw e;
//     }
//     res.throw(403, 'That entry already exists', e);
//   }
// })
// .response(joi.object().required(), 'Todo created.')
// .summary('Todo created.')
// .description('Creates a new todo in the database.')

// router.put('/todos', function (req, res) {
//   const { _key } = req.body;
//   try {
//     const data = db._query(aql`
//       UPDATE "${_key}"
//       WITH ${req.body}
//       IN ${todoColl}
//       RETURN NEW
//     `);
//     res.send(data)
//   } catch (e) {
//     if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
//       throw e;
//     }
//     res.throw(404, 'The entry does not exist', e);
//   }
// })
// .response(joi.object().required(), 'Todo updated.')
// .summary('Update a Todo')
// .description('Update a todo in the database.');

router.get('/todos', function (req, res) {
  try {
    const data = db._query(aql`
      FOR t IN ${todoColl}
      RETURN t
    `);
    res.send(data)
  } catch (e) {
    if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
      throw e;
    }
    res.throw(404, 'Oops! not found.', e);
  }
})
.response(joi.object().required(), 'Fetched all todos from the collection.')
.summary('Retrieve all todos')
.description('Retrieves all todos from collection.');

// router.delete('/todos', function (req, res) {
//   try {
//     const data = db._query(aql`
//       REMOVE "${req.queryParams._key}" IN ${todoColl}
//     `);
//     res.send(data)
//   } catch (e) {
//     if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
//       throw e;
//     }
//     res.throw(403, 'That operation is not allowed.', e);
//   }
// })
// .response(joi.object().required(), 'Delete a todo from the collection.')
// .summary('Delete a todo')
// .description('Delete a todo from a collection.');
