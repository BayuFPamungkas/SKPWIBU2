import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const id = parseInt(req.query.id as string)

    if (isNaN(id)) {
        return res.status(400).json({ error: 'ID tidak valid' })
    }

    try {
        if (req.method === 'PUT') {
            const { nama } = req.body
            if (!nama || typeof nama !== 'string') {
                return res.status(400).json({ error: 'Nama sub-kriteria wajib diisi' })
            }

            const updated = await prisma.subKriteria.update({
                where: { id },
                data: { nama },
            })
            return res.status(200).json(updated)

        } else if (req.method === 'DELETE') {
            // Hapus skor peserta yang mengacu pada subkriteria ini
            await prisma.skorPeserta.deleteMany({
                where: { subKriteriaId: id },
            });

            // Setelah itu, hapus subkriteria
            await prisma.subKriteria.delete({
                where: { id },
            });

            return res.status(200).json({ success: true });

        } else {
            res.setHeader('Allow', ['PUT', 'DELETE'])
            return res.status(405).end(`Method ${req.method} Not Allowed`)
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Terjadi kesalahan pada server' })
    }
}
