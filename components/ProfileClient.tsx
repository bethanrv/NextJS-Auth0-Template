"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export default function ProfileClient() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{String(error)}</div>;

  return (
    user && (
      <div>
        {user.picture && (
          <img src={user.picture} alt={user.name || "User Profile Photo"} />
        )}

        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
    )
  );
}
