import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="text-center space-y-4 py-20">
      <h1 className="text-4xl font-extrabold">404</h1>
      <p className="text-gray-600">We couldn’t find that page.</p>
      <Link href="/" className="text-blue-600 hover:underline">Go back home</Link>
    </main>
  );
}

