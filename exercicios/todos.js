const todos = []
const { validate, validations } = require('indicative/validator')
const { sanitize } = require('indicative/sanitizer')

module.exports = (app, db) => {
  app.get('/todos', (req, res) => {
    const { limit, page } = req.query

    const _limit = +limit
    const _page = +page

    db.query('SELECT COUNT(idtodos) FROM todos', (error, countResults, _) => {
      if (error) {
        throw error
      }

      const offset = (_page - 1) * _limit
      const total = countResults[0]['COUNT(idtodos)']
      const pageCount = Math.ceil(total / limit)
      
      db.query('SELECT * FROM todos LIMIT ?, ?', [offset, _limit], (error, results, _) => {
        if (error) {
          throw error
        }

        res.send({
          code: 200,
          meta: {
            pagination: {
              total: total,
              pages: pageCount,
              page: _page,
              limit: _limit
            }
          },
          data: results
        })
      })
    })
  })

  app.get('/todos/:idtodos', ( res, req) => {
    const {idtodos} = req.params
    
    db.query('SELECT * FROM todos WHERE idtodos = ? ', [idtodos], (error, results,_)=> {
     if (error){
     throw error
     }
     res.send(results[0])
    })
  })

  app.post('/todos', (req, res) => {
  const todo = req.body
  const rules = {
    id_user: 'required',
    title: 'required',
    completed:'boolean'
    
  }
  const sanitizationRules = {
    title: 'lowerCase|escape|strip_tags',
    completed: 'escape|strip_tags',
    }

    validate(todo, rules, sanitizationRules)
    .then((results) => {
      sanitize(results, sanitizationRules)

    db.query('INSERT INTO todos SET ?', [todo], (error, results, _) => {
      if (error) {
        throw error
      }

      const { insertId } = results

      db.query('SELECT * FROM todos WHERE id_user = ? LIMIT 1', [insertId], (error, results, _) => {
        if (error) {
          throw error
        }
        
        res.send(results[0])
      })
      })
    })
  })
  
  app.put('/todos/:idtodos', (req, res) => {
    const { id } = req.params

    const todo = req.body

    db.query('UPDATE todos SET ? WHERE idtodos = ?', [todo, id], (error, results, _) => {
      if (error) {
        throw error
      }

      db.query('SELECT * FROM todos WHERE idtodos = ? LIMIT 1', [id], (error, results, _) => {
        if (error) {
          throw error
        }

        res.send(results[0])
      })
    })
  })
  app.patch('/todos/:idtodos/activated', (req, res) => {
    const { id } = req.params

    const { isActive } = req.body

    const status = isActive ? 1 : 0

    db.query('UPDATE todos SET completed = ? WHERE idtodos = ?', [status, id], (error, results, _) => {
      if (error) {
        throw error
      }

      res.send(isActive)
    })
  })

  app.delete('/todos/:idtodos', (req, res) => {
    const { id } = req.params

    db.query('SELECT * FROM todos WHERE idtodos = ?', [id], (error, results, _) => {
      if (error) {
        throw error
      }

      const [todo] = results

      db.query('DELETE FROM todos WHERE idtodos = ?', [id], (error, _, __) => {
        if (error) {
          throw error
        }

        res.send(todo)
      })
    })
  })
}