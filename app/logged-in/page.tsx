import { getSession } from "@auth0/nextjs-auth0";
import { redirect } from "next/navigation";

export default async function LoggedIn() {
  const session = await getSession();

  if (!session) {
    redirect("/unauthorized");
  }

  const user = session?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome back
          <span className="text-indigo-600 block mt-1">
            {user?.name || "Guest"}
          </span>
        </h1>
        <p className="text-gray-600">
          You're now logged into your secure dashboard.
        </p>
      </div>
    </div>
  );
}
