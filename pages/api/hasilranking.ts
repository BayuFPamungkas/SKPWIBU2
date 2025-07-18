// pages/api/hasilranking.ts
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { data } = req.body
    if (!Array.isArray(data)) {
      return res.status(400).json({ message: 'Invalid data format' })
    }

    try {
      await prisma.hasilRanking.deleteMany()
      await prisma.hasilRanking.createMany({ data })
      return res.status(200).json({ message: 'Hasil ranking disimpan' })
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Gagal simpan hasil ranking' })
    }
  }

  // === INI BAGIAN YANG PENTING ===
  if (req.method === 'GET') {
    try {
      const result = await prisma.hasilRanking.findMany({
        include: { peserta: true },
        orderBy: { ranking: 'asc' }
      })
      return res.status(200).json(result) // <-- HARUS array
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Gagal ambil hasil ranking' })
    }
  }

  return res.status(405).end()
}
