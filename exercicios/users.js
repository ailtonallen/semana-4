module.exports = (app, connection) => {
  app.get('/users', (req, res) => {
    const { page, limit } = req.query

    connection.query('SELECT COUNT(*) FROM users', (error, results) => {
      if (error) {
        throw error
      }

      const count = results[0]['COUNT(*)']
      const limitAsNumber = Number(limit)
      const pageAsNumber = Number(page)
      const offset = Number((pageAsNumber - 1) * limit)

      connection.query('SELECT * FROM users LIMIT ?, ?', [offset, limitAsNumber], (error, results, _) => {
        if (error) {
          throw error
        }

        const pages = Math.ceil(count / limit)

        res.send({
          code: 200,
          meta: {
            pagination: {
              total: count,
              pages: pages,
              page: pageAsNumber,
            }
          },
          data: results,
        })
      })
    })
  })

  app.get('/users/:usersid', (req, res) => {
    const { id } = req.params

    connection.query('SELECT * FROM users WHERE usersid = ? LIMIT 1', [id], (error, results, _) => {
      if (error) {
        throw error
      }

      res.send(results[0])
    })
  })

  app.post('/users', (req, res) => {
    const user = req.body
    const rules = {
      name: 'required',
      email: 'required|email',
      status:'boolean'
    }

     const sanitizationRules = {
    name: 'trim|escape|strip_tags',
    email: 'escape|strip_tags',
    status: 'escape|strip_tags',
    
  }

    validate(user, rules, sanitizationRules)
    .then((results) => {
    sanitize(results, sanitizationRules)

    connection.query('INSERT INTO users SET ?', [user], (error, results, _) => {
      if (error) {
        throw error
      }

      const { insertId } = results

      connection.query('SELECT * FROM users WHERE usersid = ? LIMIT 1', [insertId], (error, results, _) => {
        if (error) {
          throw error
        }

        res.send(results[0])
      })
    })
  })
})

  app.put('/users/:usersid', (req, res) => {
    const { id } = req.params

    const user = req.body

    connection.query('UPDATE users SET ? WHERE usersid = ?', [user, id], (error, results, _) => {
      if (error) {
        throw error
      }

      connection.query('SELECT * FROM users WHERE usersid = ? LIMIT 1', [id], (error, results, _) => {
        if (error) {
          throw error
        }

        res.send(results[0])
      })
    })
  })

  app.patch('/users/:usersid/activated', (req, res) => {
    const { id } = req.params

    const { isActive } = req.body

    const status = isActive ? 1 : 0

    connection.query('UPDATE users SET status = ? WHERE usersid = ?', [status, id], (error, results, _) => {
      if (error) {
        throw error
      }

      res.send(isActive)
    })
  })

  app.delete('/users/:usersid', (req, res) => {
    const { id } = req.params

    connection.query('SELECT * FROM users WHERE usersid = ?', [id], (error, results, _) => {
      if (error) {
        throw error
      }

      const [user] = results

      connection.query('DELETE FROM users WHERE usersid = ?', [id], (error, _, __) => {
        if (error) {
          throw error
        }

        res.send(user)
      })
    })
  })
}