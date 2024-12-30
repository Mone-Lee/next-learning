'use server'

import { revalidatePath } from "next/cache";
import { updateUser } from "@/app/data-access/user";

export default async function updateNameAction(prevState: {
  userId: string
  name: string
}, formData: FormData) {

  // sleep 1 second
  await new Promise(resolve => setTimeout(resolve, 1000));

  const userId = prevState.userId;
  const newName = formData.get("name") as string;
  await updateUser(userId, newName);

  // 立即刷新当前页面
  revalidatePath(`/users/${userId}`);

  return {
    userId,
    name: newName,
    message: 'success',
  }
}