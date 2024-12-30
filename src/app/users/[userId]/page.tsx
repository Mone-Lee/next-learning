import { revalidatePath } from "next/cache";
import { getUser, updateUser } from "../../data-access/user";

export default async function UsersPage({
  params,
}: {
  params: {
    userId: string;
  };
}) {
  const user = await getUser(params.userId);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        USER: {user.name}
        <form
          action={async (formData: FormData) => {
            "use server";

            const name = formData.get("name") as string;
            await updateUser(user.id, name);

            // 立即刷新当前页面
            revalidatePath(`/users/${user.id}`);
          }}
        >
          <input className="p-2 border-2" type="text" name="name" />
          <button
            className="btn-primary p-2 border-2 bg-black text-white"
            type="submit"
          >
            Submit
          </button>
        </form>
      </main>
    </div>
  );
}
