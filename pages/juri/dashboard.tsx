import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
    normalizeMatrix,
    calculatePriorityVector,
    calculateConsistencyRatio,
    Matrix
} from '@/lib/ahp'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

type SubKriteria = { id: number; nama: string }
type Kriteria = { id: number; nama: string; subKriteria: SubKriteria[] }
type Peserta = { id: number; nama: string; nomor: number; karakter: string }

export default function DashboardJuri() {
    const router = useRouter()

    // Data kriteria + subkriteria
    const [kriteria, setKriteria] = useState<Kriteria[]>([])
    // Data peserta
    const [peserta, setPeserta] = useState<Peserta[]>([])

    // Form tambah kriteria & subkriteria
    const [namaKriteria, setNamaKriteria] = useState('')
    const [namaSub, setNamaSub] = useState('')
    const [selectedKriteriaId, setSelectedKriteriaId] = useState<number | null>(null)
    const [error, setError] = useState('')
    const [editSubId, setEditSubId] = useState<number | null>(null);
    const [editSubNama, setEditSubNama] = useState('');


    // Matriks dan hasil AHP untuk kriteria
    const [matrixKriteria, setMatrixKriteria] = useState<Matrix>([])
    const [priorityVectorKriteria, setPriorityVectorKriteria] = useState<number[]>([])
    const [consistencyRatioKriteria, setConsistencyRatioKriteria] = useState<number | null>(null)

    // Matriks dan hasil AHP per subkriteria (disimpan per kriteriaId)
    const [matrixSub, setMatrixSub] = useState<{ [kriteriaId: number]: Matrix }>({})
    const [priorityVectorSub, setPriorityVectorSub] = useState<{ [kriteriaId: number]: number[] }>({})
    const [consistencyRatioSub, setConsistencyRatioSub] = useState<{ [kriteriaId: number]: number | null }>({})

    // Skor peserta per subkriteria [pesertaId][subkriteriaId] = skor
    const [skorPeserta, setSkorPeserta] = useState<{ [pesertaId: number]: { [subKriteriaId: number]: number } }>({})

    // Ambil data kriteria dan peserta
    useEffect(() => {
        fetchKriteria()
        fetchPeserta()
    }, [])

    async function fetchKriteria() {
        try {
            const res = await fetch('/api/kriteria')
            const data = await res.json()
            setKriteria(data)

            // Init matriks kriteria & subkriteria
            if (data.length >= 2) {
                // Matrix kriteria
                const n = data.length
                const initMat = Array(n).fill(null).map(() => Array(n).fill(1))
                setMatrixKriteria(initMat)
                setPriorityVectorKriteria([])
                setConsistencyRatioKriteria(null)

                // Matriks subkriteria per kriteria
                const newMatrixSub: { [key: number]: Matrix } = {}
                data.forEach((k, i) => {
                    if (k.subKriteria.length >= 2) {
                        const m = k.subKriteria.length
                        newMatrixSub[k.id] = Array(m).fill(null).map(() => Array(m).fill(1))
                    }
                })
                setMatrixSub(newMatrixSub)
                setPriorityVectorSub({})
                setConsistencyRatioSub({})
            }
        } catch (error) {
            console.error('Error fetch kriteria:', error)
        }
    }

    async function fetchPeserta() {
        try {
            const res = await fetch('/api/peserta')
            const data = await res.json()
            setPeserta(data)
        } catch (error) {
            console.error('Error fetch peserta:', error)
        }
    }

    // Tambah kriteria
    const tambahKriteria = async () => {
        if (!namaKriteria.trim()) {
            setError('Nama kriteria wajib diisi')
            return
        }
        try {
            await fetch('/api/kriteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama: namaKriteria }),
            })
            setNamaKriteria('')
            setError('')
            fetchKriteria()
        } catch {
            setError('Gagal tambah kriteria')
        }
    }

    // Tambah subkriteria
    const tambahSubKriteria = async () => {
        if (!namaSub.trim() || !selectedKriteriaId) {
            setError('Pilih kriteria dan isi nama sub-kriteria')
            return
        }
        try {
            await fetch('/api/subkriteria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama: namaSub, kriteriaId: selectedKriteriaId }),
            })
            setNamaSub('')
            setError('')
            fetchKriteria()
        } catch {
            setError('Gagal tambah sub-kriteria')
        }
    }

    // Edit subkriteria
    const editSubKriteria = async (id: number, namaBaru: string) => {
        try {
            await fetch(`/api/subkriteria/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nama: namaBaru }),
            });
            fetchKriteria();
        } catch {
            setError('Gagal edit sub-kriteria');
        }
    };

    // Hapus subkriteria
    const hapusSubKriteria = async (id: number) => {
        try {
            const res = await fetch(`/api/subkriteria/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Gagal hapus');
            fetchKriteria();
        } catch {
            setError('Gagal hapus sub-kriteria');
        }
    };


    // Update matriks kriteria
    const updateMatrixKriteriaValue = (i: number, j: number, value: number) => {
        if (i === j) return
        // if (value <= 0) return
        const newMatrix = matrixKriteria.map(row => [...row])
        newMatrix[i][j] = value
        newMatrix[j][i] = 1 / value
        setMatrixKriteria(newMatrix)
    }

    // Update matriks subkriteria per kriteria
    const updateMatrixSubValue = (kriteriaId: number, i: number, j: number, value: number) => {
        if (i === j) return
        // if (value <= 0) return
        const mat = matrixSub[kriteriaId] || []
        const newMat = mat.map(row => [...row])
        newMat[i][j] = value
        newMat[j][i] = 1 / value
        setMatrixSub({ ...matrixSub, [kriteriaId]: newMat })
    }





    // Hitung AHP untuk kriteria
    const calculateAHPKriteria = () => {
        if (!matrixKriteria.length) return
        try {
            const normalized = normalizeMatrix(matrixKriteria)
            const priority = calculatePriorityVector(normalized)
            const cr = calculateConsistencyRatio(matrixKriteria, priority)
            setPriorityVectorKriteria(priority)
            setConsistencyRatioKriteria(cr)
            if (cr > 0.1) setError('CR kriteria lebih dari 0.1, cek inputan matriks.')
            else setError('')
        } catch (e) {
            setError('Error perhitungan AHP kriteria')
        }
    }

    // Hitung AHP untuk subkriteria per kriteriaId
    const calculateAHPSub = (kriteriaId: number) => {
        const mat = matrixSub[kriteriaId]
        if (!mat || !mat.length) return
        try {
            const normalized = normalizeMatrix(mat)
            const priority = calculatePriorityVector(normalized)
            const cr = calculateConsistencyRatio(mat, priority)
            setPriorityVectorSub(prev => ({ ...prev, [kriteriaId]: priority }))
            setConsistencyRatioSub(prev => ({ ...prev, [kriteriaId]: cr }))
            if (cr > 0.1) setError(`CR subkriteria "${getNamaKriteria(kriteriaId)}" > 0.1, cek inputan.`)
            else setError('')
        } catch {
            setError(`Error perhitungan AHP subkriteria "${getNamaKriteria(kriteriaId)}"`)
        }
    }

    // Dapatkan nama kriteria dari id
    const getNamaKriteria = (id: number) => {
        return kriteria.find(k => k.id === id)?.nama || ''
    }

    // Update skor peserta
    const updateSkorPeserta = (pesertaId: number, subKriteriaId: number, value: number) => {
        // if (value < 0) return
        setSkorPeserta(prev => ({
            ...prev,
            [pesertaId]: { ...(prev[pesertaId] || {}), [subKriteriaId]: value }
        }))
    }

    // Logout
    const logout = () => router.push('/')

    // Hitung total skor dan ranking peserta
    const [hasilRanking, setHasilRanking] = useState<{ pesertaId: number; nama: string; skor: number }[]>([])

    const hitungTotalSkorDanRanking = () => {
        if (priorityVectorKriteria.length === 0) {
            setError("Silakan hitung AHP kriteria terlebih dahulu.");
            return;
        }

        for (const k of kriteria) {
            if ((k.subKriteria.length >= 2) && (!priorityVectorSub[k.id] || priorityVectorSub[k.id].length === 0)) {
                setError(`Silakan hitung AHP sub-kriteria untuk "${k.nama}" terlebih dahulu.`);
                return;
            }
        }

        const totalPerPeserta: { pesertaId: number; nama: string; skor: number }[] = peserta.map(p => {
            let total = 0;

            kriteria.forEach((k, ki) => {
                const weightKriteria = priorityVectorKriteria[ki] ?? 0;
                const subPriorities = priorityVectorSub[k.id] ?? [];

                const subSkor = k.subKriteria.reduce((sum, s, si) => {
                    const bobotSub = subPriorities[si] ?? 0;
                    const skor = skorPeserta[p.id]?.[s.id] ?? 0;
                    return sum + bobotSub * skor;
                }, 0);

                total += weightKriteria * subSkor;
            });

            return { pesertaId: p.id, nama: `${p.nomor}. ${p.nama}`, skor: total };
        });

        const sorted = totalPerPeserta.sort((a, b) => b.skor - a.skor);
        setHasilRanking(sorted);
        setError('');
    };

    // Simpan skor peserta ke database
    const simpanSkorPeserta = async () => {
        const payload: { pesertaId: number; subKriteriaId: number; nilai: number }[] = []

        for (const [pesertaId, subMap] of Object.entries(skorPeserta)) {
            for (const [subKriteriaId, nilai] of Object.entries(subMap)) {
                payload.push({
                    pesertaId: Number(pesertaId),
                    subKriteriaId: Number(subKriteriaId),
                    nilai: nilai
                })
            }
        }

        try {
            const res = await fetch('/api/skorpeserta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: payload })
            })
            if (!res.ok) throw new Error('Gagal menyimpan skor')
            alert('Skor peserta berhasil disimpan ke database.')
        } catch (err) {
            console.error(err)
            alert('Terjadi kesalahan saat menyimpan skor.')
        }
    }

    // export excel
    const exportHasil = (format: 'csv' | 'xlsx') => {
        if (peserta.length === 0 || kriteria.length === 0) return

        const allSub = kriteria.flatMap(k => k.subKriteria)

        const rows = peserta.map(p => {
            const row: any = {
                Nomor: p.nomor,
                Nama: p.nama,
            }

            allSub.forEach(s => {
                row[s.nama] = skorPeserta[p.id]?.[s.id] ?? 0
            })

            const total = hasilRanking.find(h => h.pesertaId === p.id)?.skor ?? 0
            const ranking = hasilRanking.findIndex(h => h.pesertaId === p.id)
            row['Total Skor'] = total
            row['Ranking'] = ranking >= 0 ? ranking + 1 : ''

            return row
        })

        if (format === 'csv') {
            const csv = Papa.unparse(rows)
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
            saveAs(blob, 'hasil-ranking.csv')
        } else if (format === 'xlsx') {
            const ws = XLSX.utils.json_to_sheet(rows)
            const wb = XLSX.utils.book_new()
            XLSX.utils.book_append_sheet(wb, ws, 'Ranking')
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
            const data = new Blob([excelBuffer], { type: 'application/octet-stream' })
            saveAs(data, 'hasil-ranking.xlsx')
        }
    }



    return (
        <div className="min-h-screen bg-pink-50 bg-[url('/japan3.jpg')] bg-cover bg-center flex items-center justify-center">
            <div className="max-w-4xl mx-auto p-6 bg-white/70 backdrop-blur-md shadow-xl rounded-xl mt-8" style={{ maxWidth: '1100px', width: '100%' }}>
                <div className='flex justify-between items-center mb-6'>
                    <h1 className="text-4xl font-bold mb-6 text-pink-700 font-mono">Dashboard Juri</h1>
                    <button
                        onClick={logout}
                        className="mb-6 bg-red-400 text-white px-4 py-2 rounded hover:bg-red-500 transition mt-6"
                    >
                        Logout
                    </button>
                </div>

                {error && <p className="mb-4 text-red-600">{error}</p>}

                {/* Form Tambah Kriteria */}
                <section className="bg-red-200 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
                    <h2 className="text-xl mb-3">Tambah Kriteria</h2>
                    <input
                        type="text"
                        placeholder="Nama Kriteria"
                        className="flex bg-white px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={namaKriteria}
                        onChange={(e) => setNamaKriteria(e.target.value)}
                    />
                    <button
                        onClick={tambahKriteria}
                        className="bg-pink-400 hover:bg-pink-600 text-white px-4 py-2 rounded transition"
                    >
                        Tambah Kriteria
                    </button>
                </section>

                {/* Form Tambah Sub-Kriteria */}
                <section className="bg-red-200 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
                    <h2 className="text-xl mb-3">Tambah Sub-Kriteria</h2>
                    <select
                        className="flex rounded-md bg-white p-2 mb-3 w-53"
                        value={selectedKriteriaId ?? ''}
                        onChange={(e) => setSelectedKriteriaId(Number(e.target.value))}
                    >
                        <option value="" disabled>
                            Pilih Kriteria
                        </option>
                        {kriteria.map(k => (
                            <option key={k.id} value={k.id}>{k.nama}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Nama Sub-Kriteria"
                        className="flex bg-white px-4 py-2 mb-4 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        value={namaSub}
                        onChange={(e) => setNamaSub(e.target.value)}
                    />
                    <button
                        onClick={tambahSubKriteria}
                        className="bg-pink-400 hover:bg-pink-600 text-white px-4 py-2 rounded transition"
                    >
                        Tambah Sub-Kriteria
                    </button>
                </section>

                {/* Daftar Kriteria & Subkriteria */}
                <section className="bg-red-200 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
                    <h2 className="text-xl mb-3">Daftar Kriteria & Sub-Kriteria</h2>
                    {kriteria.length === 0 ? (
                        <p>Belum ada kriteria</p>
                    ) : (
                        <ul className="list-disc ml-6">
                            {kriteria.map(k => (
                                <li key={k.id}>
                                    <strong>{k.nama}</strong>
                                    {k.subKriteria.length === 0 ? (
                                        <span> (Belum ada sub-kriteria)</span>
                                    ) : (
                                        <ul className="list-disc ml-6">
                                            {k.subKriteria.map(s => (
                                                <li key={s.id} className="flex items-center gap-2 mb-1 justify-between">
                                                    {editSubId === s.id ? (
                                                        <>
                                                            <input
                                                                type="text"
                                                                className="rounded-md bg-white px-2 py-1"
                                                                value={editSubNama}
                                                                onChange={(e) => setEditSubNama(e.target.value)}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    editSubKriteria(s.id, editSubNama)
                                                                    setEditSubId(null)
                                                                    setEditSubNama('')
                                                                }}
                                                                className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 ml-auto"
                                                            >
                                                                Simpan
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditSubId(null)
                                                                    setEditSubNama('')
                                                                }}
                                                                className="bg-gray-400 text-white px-2 py-1 rounded hover:bg-gray-500"
                                                            >
                                                                Batal
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{s.nama}</span>
                                                            <div>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditSubId(s.id)
                                                                        setEditSubNama(s.nama)
                                                                    }}
                                                                    className="bg-blue-300 text-white px-2 py-1 me-4 rounded hover:bg-blue-600"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => hapusSubKriteria(s.id)}
                                                                    className="bg-red-400 text-white px-2 py-1 rounded hover:bg-red-600"
                                                                >
                                                                    Hapus
                                                                </button>
                                                            </div>
                                                        </>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>

                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Matriks Perbandingan Kriteria */}
                {kriteria.length >= 2 && (
                    <section className="bg-red-200 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
                        <h2 className="text-2xl mb-4 font-semibold">Matriks Perbandingan Kriteria AHP</h2>
                        <div className="mb-4">
                            <p className="text-sm text-black">
                                Masukkan nilai perbandingan antar kriteria. Nilai 1 berarti sama penting,
                                nilai 3 berarti sedikit lebih penting, 5 berarti lebih penting,
                                7 berarti sangat penting, dan 9 berarti mutlak penting.
                            </p>
                        </div>
                        <div className='relative overflow-x-auto sm:rounded-lg'>
                            <table className="border-collapse border border-pink-300 w-full ">
                                <thead className='bg-pink-100'>
                                    <tr>
                                        <th className=" p-2">Kriteria</th>
                                        {kriteria.map(k => (
                                            <th key={k.id} className="border border-pink-300 p-2">{k.nama}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='bg-white'>
                                    {kriteria.map((rowKriteria, i) => (
                                        <tr key={rowKriteria.id}>
                                            <td className="border border-pink-300 p-2 font-semibold">{rowKriteria.nama}</td>
                                            {kriteria.map((_, j) => (
                                                <td key={j} className="border border-pink-300 p-2 text-center">
                                                    {i === j ? (
                                                        1
                                                    ) : i < j ? (
                                                        <input
                                                            type="number"
                                                            min={0.111}
                                                            max={9}
                                                            step={0.001}
                                                            className="w-16 p-1 border rounded text-center"
                                                            value={matrixKriteria[i]?.[j] ?? ''}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value)
                                                                e.target.value = isNaN(val) ? '' : val.toString();
                                                                if (isNaN(val)) {
                                                                    updateMatrixKriteriaValue(i, j, 0)
                                                                    return
                                                                }
                                                                updateMatrixKriteriaValue(i, j, val)
                                                            }}
                                                        />
                                                    ) : (
                                                        matrixKriteria[i]?.[j]?.toFixed(3)
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button
                            onClick={calculateAHPKriteria}
                            className="bg-pink-400 hover:bg-pink-600 text-white mt-4 px-4 py-2 rounded transition"
                        >
                            Hitung AHP & Uji Konsistensi Kriteria
                        </button>
                        {priorityVectorKriteria.length > 0 && (
                            <div className="mt-4">
                                <h3 className="text-xl font-semibold mb-2">Prioritas Kriteria</h3>
                                <ul className="list-disc ml-6 mb-4">
                                    {priorityVectorKriteria.map((p, idx) => (
                                        <li key={kriteria[idx].id}>
                                            {kriteria[idx].nama}: {p.toFixed(4)}
                                        </li>
                                    ))}
                                </ul>
                                <p>Consistency Ratio (CR): {consistencyRatioKriteria?.toFixed(4)}</p>
                                {consistencyRatioKriteria !== null && consistencyRatioKriteria > 0.1 && (
                                    <p className="text-red-600">
                                        CR lebih dari 0.1, mohon perbaiki input matriks.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Matriks Perbandingan Subkriteria per Kriteria */}
                {kriteria.map((k) => (
                    k.subKriteria.length >= 2 && (
                        <section key={k.id} className="bg-red-200 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
                            <h2 className="text-2xl mb-4 font-semibold">
                                Matriks Perbandingan Sub-Kriteria untuk "{k.nama}"
                            </h2>
                            <div className="mb-4">
                                <p>
                                    Masukkan nilai perbandingan antar kriteria.
                                </p>
                                <ul className='text-sm text-black list-disc ml-6 mb-2'>
                                    <li>Nilai 1 berarti sama penting</li>
                                    <li>Nilai 3 berarti sedikit lebih penting</li>
                                    <li>Nilai 5 berarti lebih penting</li>
                                    <li>Nilai 7 berarti sangat penting</li>
                                    <li>Nilai 9 berarti mutlak penting</li>
                                </ul>
                            </div>
                            <div className='relative overflow-x-auto sm:rounded-lg'>
                                <table className="border-collapse border border-pink-300 w-full">
                                    <thead className='bg-pink-100'>
                                        <tr>
                                            <th className="border border-pink-300 p-2">Sub-Kriteria</th>
                                            {k.subKriteria.map(s => (
                                                <th key={s.id} className="border border-pink-300 p-2">{s.nama}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className='bg-white'>
                                        {k.subKriteria.map((rowSub, i) => (
                                            <tr key={rowSub.id}>
                                                <td className="border border-gray-300 p-2 font-semibold">{rowSub.nama}</td>
                                                {k.subKriteria.map((_, j) => (
                                                    <td key={j} className="border border-gray-300 p-2 text-center">
                                                        {i === j ? (
                                                            1
                                                        ) : i < j ? (
                                                            <input
                                                                type="number"
                                                                min={0.111}
                                                                max={9}
                                                                step={0.001}
                                                                className="w-16 p-1 border rounded text-center"
                                                                value={matrixSub[k.id]?.[i]?.[j] ?? ''}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value)
                                                                    e.target.value = isNaN(val) ? '' : val.toString();
                                                                    if (isNaN(val)) {
                                                                        updateMatrixSubValue(k.id, i, j, 0)
                                                                        return
                                                                    }
                                                                    updateMatrixSubValue(k.id, i, j, val)
                                                                }}
                                                            />
                                                        ) : (
                                                            matrixSub[k.id]?.[i]?.[j]?.toFixed(3)
                                                        )}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <button
                                onClick={() => calculateAHPSub(k.id)}
                                className="bg-pink-400 hover:bg-pink-600 text-white mt-4 px-4 py-2 rounded transition"
                            >
                                Hitung AHP & Uji Konsistensi Subkriteria "{k.nama}"
                            </button>
                            {priorityVectorSub[k.id]?.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-xl font-semibold mb-2">Prioritas Sub-Kriteria "{k.nama}"</h3>
                                    <ul className="list-disc ml-6 mb-4">
                                        {priorityVectorSub[k.id].map((p, idx) => (
                                            <li key={k.subKriteria[idx].id}>
                                                {k.subKriteria[idx].nama}: {p.toFixed(4)}
                                            </li>
                                        ))}
                                    </ul>
                                    <p>Consistency Ratio (CR): {consistencyRatioSub[k.id]?.toFixed(4)}</p>
                                    {consistencyRatioSub[k.id] !== null && consistencyRatioSub[k.id] > 0.1 && (
                                        <p className="text-red-600">
                                            CR lebih dari 0.1, mohon perbaiki input matriks.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    )
                ))}

                {/* Input Skor Peserta per Subkriteria */}
                {kriteria.some(k => k.subKriteria.length > 0) && peserta.length > 0 && (
                    <section className="bg-red-200 mb-8 p-4 rounded shadow-rose-400/50 shadow-lg">
                        <h2 className="text-2xl mb-4 font-semibold">Input Skor Peserta per Sub-Kriteria</h2>
                        <div className='relative overflow-x-auto sm:rounded-lg'>
                            <ul className="text-sm text-black mb-2">
                                <li>Masukkan skor untuk setiap peserta berdasarkan sub-kriteria yang telah ditentukan.</li>
                                <li>Skor harus berupa angka Skala 0-10.</li>
                            </ul>
                        </div>
                        <div className='relative overflow-x-auto sm:rounded-lg'>
                            <table className="border-collapse border border-pink-300 w-full">
                                <thead className='bg-pink-100'>
                                    <tr>
                                        <th className="border border-gray-300 p-2">Peserta</th>
                                        {kriteria.flatMap(k => k.subKriteria).map(s => (
                                            <th key={s.id} className="border border-gray-300 p-2">{s.nama}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='bg-white'>
                                    {peserta.map(p => (
                                        <tr key={p.id}>
                                            <td className="border border-gray-300 p-2 font-semibold">
                                                {p.nomor}. {p.nama} ({p.karakter})
                                            </td>
                                            {kriteria.flatMap(k => k.subKriteria).map(s => (
                                                <td key={s.id} className="border border-gray-300 p-2 text-center">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        className="w-20 p-1 border rounded text-center"
                                                        value={skorPeserta[p.id]?.[s.id] ?? ''}
                                                        onChange={(e) => {
                                                            const val = parseFloat(e.target.value)
                                                            e.target.value = isNaN(val) ? '' : val.toString();
                                                            if (isNaN(val)) {
                                                                updateSkorPeserta(p.id, s.id, 0)
                                                                return
                                                            }
                                                            updateSkorPeserta(p.id, s.id, val)
                                                        }}
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 flex gap-4">
                            <button
                                onClick={simpanSkorPeserta}
                                className="bg-pink-400 hover:bg-pink-600 text-white mt-4 px-4 py-2 rounded transition"
                            >
                                Simpan Skor ke Database
                            </button>
                            <button
                                onClick={hitungTotalSkorDanRanking}
                                className="bg-pink-400 hover:bg-pink-600 text-white mt-4 px-4 py-2 rounded transition"
                            >
                                Hitung Ranking Peserta
                            </button>
                        </div>

                        {hasilRanking.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-xl font-semibold mb-3">Ranking Peserta</h3>
                                <table className="border-collapse border border-gray-300 w-full">
                                    <thead>
                                        <tr>
                                            <th className="border border-gray-300 p-2">Ranking</th>
                                            <th className="border border-gray-300 p-2">Peserta</th>
                                            <th className="border border-gray-300 p-2">Total Skor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hasilRanking.map((r, idx) => (
                                            <tr key={r.pesertaId}>
                                                <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                                                <td className="border border-gray-300 p-2">{r.nama}</td>
                                                <td className="border border-gray-300 p-2 text-center">{r.skor.toFixed(4)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </section>
                )}
                <div className="mt-4 flex gap-4">
                    <button
                        onClick={() => exportHasil('csv')}
                        className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                        Export CSV
                    </button>
                    <button
                        onClick={() => exportHasil('xlsx')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Export Excel
                    </button>
                </div>
            </div>
        </div>
    )
}
