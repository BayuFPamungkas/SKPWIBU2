// pages/api/hasilranking.ts
import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { data, acara, tanggal } = req.body;

    if (!acara || !tanggal) {
      return res.status(400).json({ error: 'Acara dan tanggal wajib diisi' });
    }

    const parsedTanggal = new Date(tanggal);

    const hasil = await prisma.hasilRanking.createMany({
      data: data.map((item: any) => ({
        ...item,
        acara,
        tanggal: parsedTanggal,
      })),
    });

    return res.status(200).json(hasil);
  }

  // === INI BAGIAN YANG PENTING ===
  if (req.method === 'GET') {
    const { tanggal } = req.query;
    if (!tanggal) {
      return res.status(400).json({ error: 'Tanggal wajib diisi' });
    }

    const parsedTanggal = new Date(tanggal);

    const hasil = await prisma.hasilRanking.findMany({
      where: { tanggal: parsedTanggal },
      include: { peserta: true },
    });

    return res.status(200).json(hasil);
  }

  return res.status(405).end()
}
