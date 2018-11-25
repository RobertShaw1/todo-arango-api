'use strict';
const createRouter = require('@arangodb/foxx/router');
const router = createRouter();
const joi = require('joi');

module.context.use(router);

/* DB INTERACTION */
const db = require('@arangodb').db;
const aql = require('@arangodb').aql;
const errors = require('@arangodb').errors;
const todoColl = db._collection('todos');
const DOC_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;


router.post('/todo', function (req, res) {
  const { text } = req.body;

  req.body.complete = false;
  req.body.due = !req.body.due ? null : req.body.due;
  req.body.list = !req.body.list ? null : req.body.list;

  try {
    const data = db._query(aql`
      UPSERT ${{text}}
      INSERT ${req.body}
      UPDATE {}
      IN ${todoColl}
      RETURN NEW
    `);
    res.status(201)
    res.send(data)
  } catch (e) {
    if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
      throw e;
    }
    res.throw(403, 'That entry already exists', e);
  }
})
.body(joi
  .object({
    due: joi.date().allow(null),
    list: joi.string().allow(null),
    text: joi.string().required(),
  })
)
.response(201, joi.object().required(), 'Todo created.')
.summary('Create a todo.')
.description('Creates a new todo in the database.')

router.put('/todos', function (req, res) {
  const { _key } = req.body;
  try {
    const data = db._query(aql`
      UPDATE ${_key}
      WITH ${req.body}
      IN ${todoColl}
      RETURN NEW
    `);
    res.send(data)
  } catch (e) {
    if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
      throw e;
    }
    res.throw(404, 'The entry does not exist', e);
  }
})
.body(joi
  .object({
    _key: joi.allow(joi.string(), joi.number()).required(),
    complete: joi.boolean().optional(),
    due: joi.date().optional(),
    list: joi.string().optional(),
    text: joi.string().optional(),
  })
)
.response(joi.object().required(), 'Todo updated.')
.summary('Update a Todo')
.description('Update a todo in the database.');

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

router.delete('/todos', function (req, res) {
  const { _key } = req.queryParams;

  try {
    const data = db._query(aql`
      REMOVE ${_key} IN ${todoColl}
    `);
    res.status(204)
    res.send(data)
  } catch (e) {
    if (!e.isArangoError || e.errorNum !== DOC_NOT_FOUND) {
      throw e;
    }
    res.throw(403, 'That operation is not allowed.', e);
  }
})
.queryParam('_key', joi.string().required())
.response(null, 'Delete a todo from the collection.')
.summary('Delete a todo')
.description('Delete a todo from a collection.');
