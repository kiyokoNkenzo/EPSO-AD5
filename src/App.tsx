import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((module) => ({ default: module.LibraryPage })));
const PlanPage = lazy(() => import('./pages/PlanPage').then((module) => ({ default: module.PlanPage })));
const PracticePage = lazy(() => import('./pages/PracticePage').then((module) => ({ default: module.PracticePage })));
const ReviewPage = lazy(() => import('./pages/ReviewPage').then((module) => ({ default: module.ReviewPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const SourcesPage = lazy(() => import('./pages/SourcesPage').then((module) => ({ default: module.SourcesPage })));
const TestSessionPage = lazy(() => import('./pages/TestSessionPage').then((module) => ({ default: module.TestSessionPage })));
const ReadingPage = lazy(() => import('./pages/ReadingPage').then((module) => ({ default: module.ReadingPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const CoachPage = lazy(() => import('./pages/CoachPage').then((module) => ({ default: module.CoachPage })));
const MistakesPage = lazy(() => import('./pages/MistakesPage').then((module) => ({ default: module.MistakesPage })));
const WritingLabPage = lazy(() => import('./pages/WritingLabPage').then((module) => ({ default: module.WritingLabPage })));
const TestDayPage = lazy(() => import('./pages/TestDayPage').then((module) => ({ default: module.TestDayPage })));
const RemindersPage = lazy(() => import('./pages/RemindersPage').then((module) => ({ default: module.RemindersPage })));

function page(element: ReactNode) {
  return <Suspense fallback={<div className="route-loading" role="status">Loading study tools…</div>}>{element}</Suspense>;
}

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={page(<DashboardPage />)} />
        <Route path="coach" element={page(<CoachPage />)} />
        <Route path="test-day" element={page(<TestDayPage />)} />
        <Route path="analytics" element={page(<AnalyticsPage />)} />
        <Route path="plan" element={page(<PlanPage />)} />
        <Route path="practice" element={page(<PracticePage />)} />
        <Route path="practice/:testId" element={page(<TestSessionPage />)} />
        <Route path="review" element={page(<ReviewPage />)} />
        <Route path="mistakes" element={page(<MistakesPage />)} />
        <Route path="writing" element={page(<WritingLabPage />)} />
        <Route path="library" element={page(<LibraryPage />)} />
        <Route path="library/:readingId" element={page(<ReadingPage />)} />
        <Route path="sources" element={page(<SourcesPage />)} />
        <Route path="reminders" element={page(<RemindersPage />)} />
        <Route path="settings" element={page(<SettingsPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
