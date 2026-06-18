import { findAllUsers, findUserById } from '../services/users.js'

export function listUsers(_req, res) {
  res.json(findAllUsers())
}

export function getUser(req, res, next) {
  const user = findUserById(Number(req.params.id))
  if (!user) {
    next()
    return
  }
  res.json(user)
}
