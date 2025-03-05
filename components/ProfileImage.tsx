"use client";

import { useUser } from "@auth0/nextjs-auth0/client";

export default function ProfileImage() {
  const { user, isLoading, error } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{String(error)}</div>;

  return (
    user && (
      <div style={{display: 'flex', justifyContent: 'end'}}>
        {user.picture && (
          <img style={{borderRadius: '10rem', height:'1.75rem'}} src={user.picture} alt={user.name || "User Profile Photo"} />
        )}
      </div>
    )
  );
}
