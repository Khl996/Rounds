/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRounds } from './hooks/useRounds';
import { useObservations } from './hooks/useObservations';
import { Header } from './components/layout/Header';
import { Navbar, NavTab } from './components/layout/Navbar';
import { AuthView } from './features/auth/AuthView';
import { DashboardView } from './features/dashboard/DashboardView';
import { ActiveRoundView } from './features/rounds/ActiveRoundView';
import { RoundDetailsView } from './features/rounds/RoundDetailsView';
import { StartRoundModal } from './features/rounds/StartRoundModal';
import { ObservationsListView } from './features/observations/ObservationsListView';
import { ObservationDetailModal } from './features/observations/ObservationDetailModal';
import { AdminManagementView } from './features/admin/AdminManagementView';
import { Round, Observation, RoundType } from './types';
import { ClipboardCheck } from 'lucide-react';

function AppContent() {
  const { appUser, loading: authLoading, isAdmin } = useAuth();
  const { rounds, activeRound, startRound, finishRound } = useRounds();
  const { observations, loading: obsLoading } = useObservations();

  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [viewingActiveRound, setViewingActiveRound] = useState(false);

  // If auth is still checking
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-xs mb-3">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold text-slate-800">جولات الصيانة</p>
      </div>
    );
  }

  // If user is not logged in
  if (!appUser) {
    return <AuthView />;
  }

  const handleStartRound = async (type: RoundType) => {
    await startRound(type);
    setIsStartModalOpen(false);
    setViewingActiveRound(true);
    setSelectedRound(null);
  };

  const handleFinishRound = async (summary?: string) => {
    if (!activeRound) return;
    await finishRound(activeRound.id, summary);
    setViewingActiveRound(false);
    const finished: Round = {
      ...activeRound,
      status: 'completed',
      summary: summary || '',
      completedAt: new Date(),
    };
    setSelectedRound(finished);
  };

  const openCount = observations.filter((o) => o.status === 'open').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        activeRound={activeRound}
        onNavigateToActiveRound={() => {
          setViewingActiveRound(true);
          setSelectedRound(null);
        }}
        currentTab={currentTab}
      />

      {/* Navigation Tabs (الرئيسية / الملاحظات / الإدارة) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setViewingActiveRound(false);
          setSelectedRound(null);
        }}
        openObservationsCount={openCount}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {viewingActiveRound && activeRound ? (
          <ActiveRoundView
            round={activeRound}
            onFinishRound={handleFinishRound}
            onObservationClick={(obs) => setSelectedObservation(obs)}
            onBackToDashboard={() => setViewingActiveRound(false)}
          />
        ) : selectedRound ? (
          <RoundDetailsView
            round={selectedRound}
            onBack={() => setSelectedRound(null)}
            onObservationClick={(obs) => setSelectedObservation(obs)}
            onContinueRound={
              selectedRound.id === activeRound?.id
                ? () => {
                    setViewingActiveRound(true);
                    setSelectedRound(null);
                  }
                : undefined
            }
          />
        ) : currentTab === 'dashboard' ? (
          <DashboardView
            rounds={rounds}
            observations={observations}
            activeRound={activeRound}
            onStartRoundClick={() => setIsStartModalOpen(true)}
            onResumeActiveRound={() => setViewingActiveRound(true)}
            onSelectRound={(r) => setSelectedRound(r)}
            onNavigateToObservations={() => setCurrentTab('observations')}
          />
        ) : currentTab === 'observations' ? (
          <ObservationsListView
            observations={observations}
            loading={obsLoading}
            onSelectObservation={(obs) => setSelectedObservation(obs)}
          />
        ) : currentTab === 'admin' && isAdmin ? (
          <AdminManagementView />
        ) : (
          <DashboardView
            rounds={rounds}
            observations={observations}
            activeRound={activeRound}
            onStartRoundClick={() => setIsStartModalOpen(true)}
            onResumeActiveRound={() => setViewingActiveRound(true)}
            onSelectRound={(r) => setSelectedRound(r)}
            onNavigateToObservations={() => setCurrentTab('observations')}
          />
        )}
      </main>

      {/* Start Round Modal */}
      <StartRoundModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onStart={handleStartRound}
      />

      {/* Observation Detail / Resolution Modal */}
      <ObservationDetailModal
        observation={selectedObservation}
        onClose={() => setSelectedObservation(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
