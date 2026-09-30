/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useRounds } from './hooks/useRounds';
import { useObservations } from './hooks/useObservations';
import { useMasterData } from './hooks/useMasterData';
import { useBackClose } from './hooks/useBackClose';
import { ToastProvider, useToast } from './components/ui/Toast';
import { Header } from './components/layout/Header';
import { BottomNav, NavTab, getNavItems } from './components/layout/Navbar';
import { AuthView } from './features/auth/AuthView';
import { HomeView } from './features/home/HomeView';
import { ActiveRoundView } from './features/rounds/ActiveRoundView';
import { RoundDetailsView } from './features/rounds/RoundDetailsView';
import { StartRoundSheet } from './features/rounds/StartRoundSheet';
import { ObservationsView } from './features/observations/ObservationsView';
import { ObservationSheet } from './features/observations/ObservationSheet';
import { AdminManagementView } from './features/admin/AdminManagementView';
import { AppUser, RoundType } from './types';
import { groupByRound } from './utils/observations';

/** A screen pushed on top of the tabs. */
type Screen = { kind: 'activeRound' } | { kind: 'round'; roundId: string } | null;

function AuthenticatedApp({ user }: { user: AppUser }) {
  const { isAdmin, logout } = useAuth();
  const { rounds, activeRound, loading: roundsLoading, error: roundsError, startRound, finishRound } = useRounds();
  const {
    observations,
    loading: observationsLoading,
    error: observationsError,
    addObservation,
    resolveObservation,
    reopenObservation,
    addComment,
  } = useObservations();
  const master = useMasterData();
  const showToast = useToast();

  const [tab, setTab] = useState<NavTab>('home');
  const [screen, setScreen] = useState<Screen>(null);
  const [startOpen, setStartOpen] = useState(false);
  const [observationId, setObservationId] = useState<string | null>(null);

  useBackClose(screen !== null, () => setScreen(null));

  const byRound = useMemo(() => groupByRound(observations), [observations]);
  const openCount = useMemo(() => observations.filter((o) => o.status === 'open').length, [observations]);
  const navItems = getNavItems(isAdmin, openCount);

  const screenKey = screen?.kind === 'round' ? screen.roundId : screen?.kind;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab, screenKey]);

  // The round was finished elsewhere (another device): leave focus mode.
  useEffect(() => {
    if (screen?.kind === 'activeRound' && !roundsLoading && !activeRound) setScreen(null);
  }, [screen, roundsLoading, activeRound]);

  const roundObservations = (roundId: string) => byRound.get(roundId)?.list ?? [];
  const openedObservation = observationId ? observations.find((o) => o.id === observationId) ?? null : null;
  const openedRound = screen?.kind === 'round' ? rounds.find((r) => r.id === screen.roundId) ?? null : null;

  const changeTab = (next: NavTab) => {
    setTab(next);
    setScreen(null);
  };

  const resumeRound = () => setScreen({ kind: 'activeRound' });

  const handleStart = async (type: RoundType) => {
    await startRound(type);
    setStartOpen(false);
    setScreen({ kind: 'activeRound' });
  };

  const handleFinish = async (summary?: string) => {
    if (!activeRound) return;
    const roundId = activeRound.id;
    await finishRound(roundId, summary);
    setScreen({ kind: 'round', roundId });
    showToast('انتهت الجولة');
  };

  const observationSheet = openedObservation && (
    <ObservationSheet
      key={openedObservation.id}
      observation={openedObservation}
      onClose={() => setObservationId(null)}
      onComment={(text) => addComment(openedObservation.id, text)}
      onResolve={(note) => resolveObservation(openedObservation, note)}
      onReopen={(reason) => reopenObservation(openedObservation, reason)}
    />
  );

  if (screen?.kind === 'activeRound' && activeRound) {
    return (
      <>
        <ActiveRoundView
          round={activeRound}
          observations={roundObservations(activeRound.id)}
          locations={master.activeLocations}
          categories={master.activeCategories}
          onAddObservation={async (location, category, description, actionTaken) => {
            await addObservation(activeRound.id, location, category, description, actionTaken);
          }}
          onFinish={handleFinish}
          onOpenObservation={setObservationId}
          onBack={() => setScreen(null)}
        />
        {observationSheet}
      </>
    );
  }

  const showResume = !!activeRound && (tab !== 'home' || (!!openedRound && openedRound.id !== activeRound.id));

  return (
    <div className="min-h-dvh bg-slate-50">
      <Header
        user={user}
        navItems={navItems}
        currentTab={tab}
        onTabChange={changeTab}
        onResumeRound={showResume ? resumeRound : undefined}
        onLogout={logout}
      />

      <main>
        {openedRound ? (
          <RoundDetailsView
            round={openedRound}
            observations={roundObservations(openedRound.id)}
            onBack={() => setScreen(null)}
            onOpenObservation={setObservationId}
            onContinue={openedRound.id === activeRound?.id ? resumeRound : undefined}
          />
        ) : tab === 'observations' ? (
          <ObservationsView
            observations={observations}
            locations={master.activeLocations}
            categories={master.activeCategories}
            loading={observationsLoading}
            error={observationsError}
            onOpenObservation={setObservationId}
            onAddDirectObservation={async (location, category, description, actionTaken) => {
              await addObservation(null, location, category, description, actionTaken);
            }}
          />
        ) : tab === 'admin' && isAdmin ? (
          <AdminManagementView master={master} />
        ) : (
          <HomeView
            user={user}
            loading={roundsLoading}
            error={roundsError}
            activeRound={activeRound}
            rounds={rounds}
            countsByRound={byRound}
            openObservationCount={openCount}
            onStartRound={() => setStartOpen(true)}
            onResumeRound={resumeRound}
            onOpenRound={(roundId) => setScreen({ kind: 'round', roundId })}
            onOpenObservations={() => changeTab('observations')}
            onAddObservation={() => changeTab('observations')}
          />
        )}
      </main>

      <BottomNav items={navItems} currentTab={tab} onTabChange={changeTab} />

      {startOpen && <StartRoundSheet onClose={() => setStartOpen(false)} onStart={handleStart} />}
      {observationSheet}
    </div>
  );
}

function AppContent() {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <span className="grid size-14 place-items-center rounded-2xl bg-sky-600 text-white">
          <ClipboardCheck className="size-7" />
        </span>
      </div>
    );
  }

  return appUser ? <AuthenticatedApp user={appUser} /> : <AuthView />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
