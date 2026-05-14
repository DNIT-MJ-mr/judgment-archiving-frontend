import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { AppShell, ProtectedRoute } from '@/components/layout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { BatchesPage, NewBatchPage, BatchDetailPage } from '@/pages/batches'
import { DataEntryQueuePage, DataEntryEditPage } from '@/pages/data-entry'
import { ValidationQueuePage, ValidationDetailPage } from '@/pages/validation'
import { JudgmentsPage, JudgmentDetailPage } from '@/pages/judgments'
import { UsersPage, CourtsPage, AuditLogsPage, TemplateManagePage, TemplateCategoriesPage } from '@/pages/admin'
import { ProfilePage, ChangePasswordPage } from '@/pages/profile'
import { TemplatesPage } from '@/pages/templates/TemplatesPage'
import { TemplateDetailPage } from '@/pages/templates/TemplateDetailPage'
import { TemplateFillPage } from '@/pages/templates/TemplateFillPage'

// Placeholder for 404
const NotFoundPage = () => <div className="p-4">404 - Page Not Found</div>


function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with AppShell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/" element={<DashboardPage />} />

        {/* Batches - requires upload permission */}
        <Route path="/batches">
          <Route
            index
            element={
              <ProtectedRoute requiredPermission="canUpload">
                <BatchesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="new"
            element={
              <ProtectedRoute requiredPermission="canUpload">
                <NewBatchPage />
              </ProtectedRoute>
            }
          />
          <Route
            path=":batchId"
            element={
              <ProtectedRoute requiredPermission="canUpload">
                <BatchDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Data Entry - requires data entry access */}
        <Route path="/data-entry">
          <Route
            index
            element={
              <ProtectedRoute requiredPermission="canAccessDataEntry">
                <DataEntryQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path=":judgmentId"
            element={
              <ProtectedRoute requiredPermission="canAccessDataEntry">
                <DataEntryEditPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Validation - requires validation access */}
        <Route path="/validation">
          <Route
            index
            element={
              <ProtectedRoute requiredPermission="canAccessValidation">
                <ValidationQueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path=":judgmentId"
            element={
              <ProtectedRoute requiredPermission="canAccessValidation">
                <ValidationDetailPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Judgments - available to all authenticated users */}
        <Route path="/judgments">
          <Route index element={<JudgmentsPage />} />
          <Route path=":judgmentId" element={<JudgmentDetailPage />} />
        </Route>

        {/* Templates - available to all authenticated users */}
        <Route path="/templates">
          <Route index element={<TemplatesPage />} />
          <Route path=":templateId" element={<TemplateDetailPage />} />
        </Route>

        {/* Admin routes - requires admin access */}
        <Route path="/admin">
          <Route
            path="users"
            element={
              <ProtectedRoute requiredPermission="canManageUsers">
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="courts"
            element={
              <ProtectedRoute requiredPermission="canManageCourts">
                <CourtsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="audit-logs"
            element={
              <ProtectedRoute requiredPermission="canAccessAdmin">
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route path="templates">
            <Route
              index
              element={
                <ProtectedRoute requiredPermission="canManageTemplates">
                  <TemplateManagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="categories"
              element={
                <ProtectedRoute requiredPermission="canManageTemplates">
                  <TemplateCategoriesPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Route>

        {/* Profile routes */}
        <Route path="/profile">
          <Route index element={<ProfilePage />} />
          <Route path="password" element={<ChangePasswordPage />} />
        </Route>
      </Route>

      {/* Template Fill Page - fullscreen, outside AppShell */}
      <Route
        path="/templates/:templateId/fill"
        element={
          <ProtectedRoute>
            <TemplateFillPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <SidebarProvider>
            <AppRoutes />
            <Toaster
              position="top-center"
              toastOptions={{
                className: 'rtl:font-arabic ltr:font-latin',
              }}
            />
          </SidebarProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
