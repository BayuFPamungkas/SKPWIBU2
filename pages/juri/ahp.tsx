import { useEffect, useState } from 'react'
import {
  normalizeMatrix,
  calculatePriorityVector,
  calculateConsistencyRatio,
  Matrix
} from '@/lib/ahp'
import { useRouter } from 'next/router'

type Kriteria = { id: number; nama: string }

export default function AhpPage() {
  const router = useRouter()
  const [kriteria, setKriteria] = useState<Kriteria[]>([])
  const [matrix, setMatrix] = useState<Matrix>([])
  const [priorityVector, setPriorityVector] = useState<number[]>([])
  const [consistencyRatio, setConsistencyRatio] = useState<number | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function fetchKriteria() {
      const res = await fetch('/api/kriteria')
      const data: Kriteria[] = await res.json()
      setKriteria(data)
    }
    fetchKriteria()
  }, [])

  // Inisialisasi matrix jika kriteria sudah didapat
  useEffect(() => {
    if (kriteria.length < 2) return
    const n = kriteria.length
    const initMatrix: number[][] = []
    for (let i = 0; i < n; i++) {
      const row: number[] = []
      for (let j = 0; j < n; j++) {
        row.push(1)
      }
      initMatrix.push(row)
    }
    setMatrix(initMatrix)
    setPriorityVector([])
    setConsistencyRatio(null)
  }, [kriteria])

  const updateMatrixValue = (i: number, j: number, value: number) => {
    if (!matrix[i] || !matrix[j]) return
    if (i === j) return
    if (value <= 0) return

    const newMatrix = matrix.map(row => [...row])
    newMatrix[i][j] = value
    newMatrix[j][i] = 1 / value
    setMatrix(newMatrix)
  }

  const handleCalculate = () => {
    if (!matrix.length) return
    try {
      const normalized = normalizeMatrix(matrix)
      const priority = calculatePriorityVector(normalized)
      const cr = calculateConsistencyRatio(matrix, priority)

      setPriorityVector(priority)
      setConsistencyRatio(cr)

      if (cr > 0.1) {
        setError('Konsistensi perbandingan rendah! Mohon cek kembali input nilai.')
      } else {
        setError('')
      }
    } catch (e) {
      console.error('Error AHP:', e)
      setError('Terjadi kesalahan pada perhitungan AHP.')
    }
  }

  const logout = () => router.push('/')

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl mb-6 font-bold">Matriks Perbandingan Kriteria AHP</h1>
      <button
        onClick={logout}
        className="mb-6 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      >
        Logout
      </button>

      {kriteria.length === 0 && (
        <p>Belum ada kriteria. Silakan tambah kriteria di dashboard juri.</p>
      )}

      {kriteria.length > 0 && (
        <>
          <table className="border-collapse border border-gray-300 mb-4">
            <thead>
              <tr>
                <th className="border border-gray-300 p-2">Kriteria</th>
                {kriteria.map((k, idx) => (
                  <th key={k.id} className="border border-gray-300 p-2">
                    {k.nama}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {kriteria.map((rowKriteria, i) => (
                <tr key={rowKriteria.id}>
                  <td className="border border-gray-300 p-2 font-semibold">{rowKriteria.nama}</td>
                  {kriteria.map((_, j) => (
                    <td key={j} className="border border-gray-300 p-2 text-center">
                      {i === j ? (
                        1
                      ) : i < j ? (
                        <input
                          type="number"
                          min="0.111"
                          max="9"
                          step="0.001"
                          className="w-16 p-1 border rounded text-center"
                          value={matrix[i]?.[j] ?? ''}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (isNaN(val)) return
                            updateMatrixValue(i, j, val)
                          }}
                        />
                      ) : (
                        matrix[i]?.[j]?.toFixed(3)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={handleCalculate}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
          >
            Hitung AHP & Uji Konsistensi
          </button>

          {error && <p className="mb-4 text-red-600">{error}</p>}

          {priorityVector.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Prioritas Kriteria</h2>
              <ul className="list-disc ml-6 mb-4">
                {priorityVector.map((p, idx) => (
                  <li key={kriteria[idx].id}>
                    {kriteria[idx].nama}: {p.toFixed(4)}
                  </li>
                ))}
              </ul>
              <p>Consistency Ratio (CR): {consistencyRatio?.toFixed(4)}</p>
              {consistencyRatio !== null && consistencyRatio > 0.1 && (
                <p className="text-red-600">
                  CR lebih dari 0.1, mohon perbaiki input matriks.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
