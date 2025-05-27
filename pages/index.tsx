import { useRouter } from 'next/router'
import { useState } from 'react'

export default function Login() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.message || 'Login gagal')
    } else {
      if (data.role === 'panitia') {
        router.push('/panitia/dashboard')
      } else if (data.role === 'juri') {
        router.push('/juri/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen bg-pink-50 bg-[url('/japan.jpg')] bg-cover bg-center flex items-center justify-center">
      <div className="bg-white/80 backdrop-blur-md shadow-2xl rounded-xl p-8 w-full max-w-md border border-pink-200">
        <h1 className="text-4xl font-bold text-center text-pink-600 mb-6 font-mono">Login</h1>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          className="w-full px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div className="w-full flex flex-col gap-2">
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-center">
          <div className="w-full max-w-xs">
            <button onClick={handleLogin} className="w-full bg-pink-500 text-white py-2 rounded-lg hover:bg-pink-600 transition">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
