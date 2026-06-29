import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <div className="p-8 dark">
      <h1 className="dark:text-primary text-secondary text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg text-primary dark:text-primary-light">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
    </div>
  )
}
