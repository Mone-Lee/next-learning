"use client";

import { useActionState } from "react";
import updateNameAction from "./actions";
import { useFormStatus } from "react-dom";

export default function Form({ userId }: { userId: string }) {
  const [state, action] = useActionState(updateNameAction, {
    userId,
  });

  return (
    <form action={action}>
      <input className="p-2 border-2" type="text" name="name" />
      <SubmitButton />
    </form>
  );
}

export const SubmitButton = () => {
  const status = useFormStatus();

  return (
    <button
      className="btn-primary p-2 border-2 bg-black text-white"
      type="submit"
    >
      {status.pending ? "Saving..." : "Submit"}
    </button>
  );
};
