export interface User {
  id: number
  name: string
}

const users: User[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
]

export function findAllUsers(): User[] {
  return users
}

export function findUserById(id: number): User | undefined {
  return users.find((user) => user.id === id)
}
