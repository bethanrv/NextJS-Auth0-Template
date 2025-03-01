import { getSession } from "@auth0/nextjs-auth0";

export default async function ProfileServer() {
  const session = await getSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <div>
      <h2>You are logged in as {user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}
