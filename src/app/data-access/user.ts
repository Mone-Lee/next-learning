type User = {
  id: string;
  name: string;
}

(global as any).user = {
  id: '50',
  name: 'Camille'
} as User;


export async function getUser(userId: string) {
  return global.user as User;
}

export async function updateUser(userId: string, userName: string) {
  (global.user as User).name = userName;
}
