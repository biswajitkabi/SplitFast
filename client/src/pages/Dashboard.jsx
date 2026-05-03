import { useAuthStore } from '../store/authStore'

export default function Dashboard() {
  const { user, logout } = useAuthStore()

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-semibold">SplitFast</h1>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900"
          >
            Log out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-gray-400">Signed in as</p>
        <h2 className="mt-2 text-3xl font-bold">{user?.name || user?.email || 'User'}</h2>

        <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-lg font-semibold">Dashboard</h3>
          <p className="mt-2 text-gray-400">
            Your groups and expenses will appear here as the app is built out.
          </p>
        </div>
      </section>
    </main>
  )
}
