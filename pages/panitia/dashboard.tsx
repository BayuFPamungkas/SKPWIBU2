import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

type Peserta = {
  id: number
  nomor: string
  nama: string
  karakter: string
}

export default function DashboardPanitia() {
  const router = useRouter()

  const [peserta, setPeserta] = useState<Peserta[]>([])
  const [nomor, setNomor] = useState('')
  const [nama, setNama] = useState('')
  const [karakter, setKarakter] = useState('')

  // Untuk edit
  const [editId, setEditId] = useState<number | null>(null)

  // Fetch peserta
  const fetchPeserta = async () => {
    const res = await fetch('/api/peserta')
    const data = await res.json()
    setPeserta(data)
  }

  useEffect(() => {
    fetchPeserta()
  }, [])

  const resetForm = () => {
    setNomor('')
    setNama('')
    setKarakter('')
    setEditId(null)
  }

  const handleSubmit = async () => {
    if (!nomor || !nama || !karakter) {
      alert('Lengkapi semua data')
      return
    }

    if (editId === null) {
      // Tambah baru
      await fetch('/api/peserta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor: parseInt(nomor), nama, karakter }),
      })
    } else {
      // Update peserta
      await fetch(`/api/peserta/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor: parseInt(nomor), nama, karakter }),
      })
    }

    await fetchPeserta()
    resetForm()
  }

  const handleEdit = (p: Peserta) => {
    setNomor(p.nomor)
    setNama(p.nama)
    setKarakter(p.karakter)
    setEditId(p.id)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Yakin hapus peserta ini?')) {
      await fetch(`/api/peserta/${id}`, { method: 'DELETE' })
      await fetchPeserta()
    }
  }

  const handleLogout = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-pink-50 bg-[url('/japan.jpg')] bg-cover bg-center flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-6 bg-white/70 backdrop-blur-md shadow-xl rounded-xl mt-8">
        <h1 className="text-3xl mb-6 font-bold text-pink-700">Dashboard Panitia</h1>

        <div className="bg-rose-100 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
          <h2 className="text-xl mb-4">{editId === null ? 'Tambah Peserta' : 'Edit Peserta'}</h2>

          <input
            type="text"
            placeholder="Nomor Peserta"
            className="bg-white w-full px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={nomor}
            onChange={(e) => setNomor(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nama Peserta"
            className="bg-white w-full px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nama Karakter Cosplay"
            className="bg-white w-full px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            value={karakter}
            onChange={(e) => setKarakter(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            className="bg-pink-400 hover:bg-pink-600 text-white mt-4 px-4 py-2 rounded transition"
          >
            {editId === null ? 'Tambah' : 'Update'}
          </button>
          {editId !== null && (
            <button
              onClick={resetForm}
              className="ml-3 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Batal
            </button>
          )}
        </div>

        <div className="bg-rose-100 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
          <h2 className="text-xl mb-4">Daftar Peserta</h2>
          <div className='relative overflow-x-auto sm:rounded-lg'>
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-pink-200">
                <tr>
                  <th className="border border-gray-300 p-2">Nomor</th>
                  <th className="border border-gray-300 p-2">Nama</th>
                  <th className="border border-gray-300 p-2">Karakter</th>
                  <th className="border border-gray-300 p-2">Aksi</th>
                </tr>
              </thead>
              <tbody className='bg-white'>
                {peserta.map((p) => (
                  <tr key={p.id}>
                    <td className="border border-gray-300 p-2 text-center">{p.nomor}</td>
                    <td className="border border-gray-300 p-2">{p.nama}</td>
                    <td className="border border-gray-300 p-2">{p.karakter}</td>
                    <td className="border border-gray-300 p-2 text-center space-x-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="bg-blue-300 px-2 py-1 rounded hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="bg-red-400 px-2 py-1 rounded text-white hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {peserta.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center p-4">
                      Belum ada peserta
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mb-6 bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500 transition mt-6"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
