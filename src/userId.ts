export function getUserId(): string {
  let id = localStorage.getItem('user_id')

  if (id !== null) {
    return id
  }

  id = window.crypto.randomUUID()

  localStorage.setItem('user_id', id)

  return id
}
