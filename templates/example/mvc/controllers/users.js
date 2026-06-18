import { findAllUsers } from '../services/users.js'

export function listUsers(_req, res) {
  res.render('users', { users: findAllUsers() })
}
