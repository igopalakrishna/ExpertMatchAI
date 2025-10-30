import Link from 'next/link';
import { StackedCards } from '@/components/StackedCards';

export default function HomePage() {
  return (
    <main className="min-h-screen w-full">
      {/* Hero matching the provided wireframe */}
      <section className="relative overflow-hidden w-full min-h-screen bg-gradient-to-br from-emerald-50 via-sky-50 to-cyan-100">
        {/* Brand top-left */}
        <div className="absolute top-4 left-4 z-50">
          <div className="inline-flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-orange-500 text-white grid place-items-center font-semibold">D</div>
            <span className="text-lg font-semibold text-gray-800">DaidaEx</span>
          </div>
        </div>
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 lg:p-12 min-h-screen">
          {/* Left copy */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 text-gray-600 mb-6">
              <span className="text-2xl">»»»</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-gray-900">
              SMARTER
              <br />
              SOLUTIONS
            </h1>
            <p className="mt-6 max-w-xl text-gray-700 text-lg">
              We use AI‑driven technology to connect you with qualified experts who help you
              build more innovative, effective, and streamlined solutions.
            </p>
            <div className="mt-8">
              <Link
                href={{ pathname: '/search' }}
                className="inline-flex items-center gap-3 rounded-full bg-gray-900 px-6 py-3 text-white hover:bg-black"
              >
                GET MATCHED
                <span className="text-xl">›</span>
              </Link>
            </div>

            <div className="mt-10 hidden lg:block text-gray-300">··· · · · · · · · · · · · · · ·</div>
          </div>

          {/* Right: dynamic stacked cards */}
          <div className="relative flex items-center justify-center">
            <StackedCards
              items={[
                {
                  title: 'Vetted Experts',
                  body:
                    'Trusted professionals with verified experience in delivering and implementing innovative solutions.',
                  img:
                    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                  alt: 'Construction professional with safety vest',
                },
                {
                  title: 'AI‑Driven Matching',
                  body: 'Smart recommendations tailored to project‑specific needs and specifications.',
                  img:
                    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80',
                  alt: 'Engineer using tablet on job site',
                },
                {
                  title: 'Simple contracting',
                  body: 'Model agreements that streamline hiring and reduce delays.',
                  img:
                    'https://images.unsplash.com/photo-1551836022-4c4c79ecde51?auto=format&fit=crop&w=1200&q=60',
                  alt: 'Team reviewing building plans',
                },
              ]}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

