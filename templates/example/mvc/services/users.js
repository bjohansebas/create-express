const users = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
]

export function findAllUsers() {
  return users
}

export function findUserById(id) {
  return users.find((user) => user.id === id)
}
