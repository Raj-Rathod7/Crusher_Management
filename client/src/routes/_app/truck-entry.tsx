import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/truck-entry')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/truck-entry"!</div>
}
