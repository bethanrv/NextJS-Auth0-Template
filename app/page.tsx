import { login, logout } from "@/actions/auth";
import ProfileServer from "@/components/ProfileServer";
import { getSession } from "@auth0/nextjs-auth0";
import Link from "next/link";
import { isUserAdmin } from "@/actions/isUserAdmin";

export default async function Home() {
  const session = await getSession();
  const isAdmin = await isUserAdmin();

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-800 shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              PnB Token Betting
            </h1>
            <div className="flex gap-4 ml-8">
              {!session ? (
                <form action={login}>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                    Login
                  </button>
                </form>
              ) : (
                <form action={logout}>
                  <button className="px-6 py-2 bg-gray-700 text-white rounded-md shadow-sm text-sm font-medium hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors">
                    Logout
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">Main Features</h2>
              <nav className="space-y-3">
                <Link
                  href="/feed"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                  <img src="/event.svg" alt="Feed" className="w-5 h-5" />
                  Fight Feed
                </Link>
                <Link
                  href="/bets"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                  <img src="/list.svg" alt="Bets" className="w-5 h-5" />
                  My Bets
                </Link>
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
                >
                  <img src="/leaderboard.svg" alt="Leaderboard" className="w-5 h-5" />
                  Leaderboard
                </Link>
              </nav>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
              <div className="space-y-3 text-gray-300">
                <p>1. Login to get your starting tokens</p>
                <p>2. Browse upcoming fights in the Feed</p>
                <p>3. Place bets on your favorite fighters</p>
                <p>4. Track your bets and climb the leaderboard</p>
                <p>5. Win tokens by making correct predictions</p>
              </div>
            </div>
          </div>

          {session ? (
            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Profile
              </h2>
              <ProfileServer />
            </div>
          ) : (
            <div className="border-t border-gray-700 pt-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Get Started
              </h2>
              <p className="text-gray-300">
                Login to start betting on fights and competing for the top spot on our leaderboard!
              </p>
            </div>
          )}

          {/* Admin Section - Only visible to admins */}
          {isAdmin && (
            <div className="border-t border-gray-700 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Admin Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-center"
                >
                  Admin Dashboard
                </Link>
                <Link
                  href="/api/protected"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-center"
                >
                  Admin API
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
