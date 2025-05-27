import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const kriteria = await prisma.kriteria.findMany({
      include: { subKriteria: true },
    })
    return res.status(200).json(kriteria)
  }
  if (req.method === 'POST') {
    const { nama } = req.body
    if (!nama) return res.status(400).json({ message: 'Nama kriteria dibutuhkan' })

    const kriteria = await prisma.kriteria.create({
      data: { nama },
    })
    return res.status(201).json(kriteria)
  }
  res.status(405).json({ message: 'Method not allowed' })
}
