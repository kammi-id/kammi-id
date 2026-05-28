import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Berita KAMMI',
};

export default function BeritaPage() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center bg-gradient-to-b from-purple-100 to-white">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Berita KAMMI</h1>
      <p className="text-lg text-gray-600">Belum ada konten.</p>
    </section>
  );
}
