import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Ambil semua peserta
    const peserta = await prisma.peserta.findMany()
    res.status(200).json(peserta)
  } else if (req.method === 'POST') {
    // Tambah peserta baru
    const { nomor, nama, karakter } = req.body
    if (!nomor || !nama || !karakter) {
      return res.status(400).json({ message: 'Data tidak lengkap' })
    }
    const newPeserta = await prisma.peserta.create({
      data: { nomor, nama, karakter },
    })
    res.status(201).json(newPeserta)
  } else {
    res.status(405).json({ message: 'Method not allowed' })
  }
}
