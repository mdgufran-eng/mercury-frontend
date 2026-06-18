import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/layout/AppShell'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { SegmentsPage } from '@/pages/SegmentsPage'
import { CallbacksPage } from '@/pages/CallbacksPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { FreelancersPage } from '@/pages/FreelancersPage'
import { TMPage } from '@/pages/TMPage'
import { DashboardPage } from '@/pages/DashboardPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="projects/:projectId/jobs/:jobId/segments" element={<SegmentsPage />} />
            <Route path="callbacks" element={<CallbacksPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="freelancers" element={<FreelancersPage />} />
            <Route path="tm" element={<TMPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
