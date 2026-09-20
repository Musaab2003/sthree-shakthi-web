import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AboutSection } from './components/AboutSection';
import { TransformationsSection } from './components/TransformationsSection';
import { PublicationsFeed } from './components/PublicationsFeed';
import { Footer } from './components/Footer';
import { PublicationViewerModal } from './components/PublicationViewerModal';
import { SubmitPublicationModal } from './components/SubmitPublicationModal';
import { AdminPortal } from './components/AdminPortal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { UserAuthModal } from './components/UserAuthModal';
import { ContributorDashboard } from './components/ContributorDashboard';
import { NotificationsModal } from './components/NotificationsModal';

import { Publication, DatabaseConfig, UserAccount, UserNotification } from './types';
import { storageService } from './services/storageService';
import { firebaseService } from './services/firebaseService';

export function App() {
  const [allPublications, setAllPublications] = useState<Publication[]>([]);
  const [activeSection, setActiveSection] = useState<string>('hero');
  
  // Contributor / User State
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => storageService.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalNotice, setAuthModalNotice] = useState('');
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>(() => {
    const u = storageService.getCurrentUser();
    return u?.email ? storageService.getNotifications(u.email) : [];
  });

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [viewingPublication, setViewingPublication] = useState<Publication | null>(null);
  
  // DB Config
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>(() => storageService.getDatabaseConfig());

  // Load data & attach hidden admin triggers on initial render
  useEffect(() => {
    const pubs = storageService.getAllPublications();
    setAllPublications(pubs);
    const cfg = storageService.getDatabaseConfig();
    setDbConfig(cfg);

    // Cloud Synchronization for multi-device live submissions
    const performCloudSync = async () => {
      const { publications: syncedPubs } = await storageService.syncFromCloud();
      if (syncedPubs) {
        const rehydrated = storageService.rehydratePublicationsWithLocalFiles(syncedPubs);
        setAllPublications(rehydrated);
        storageService.savePublications(rehydrated);
      }
    };

    // Initial sync
    performCloudSync();

    // Attach real-time Firebase Firestore listener
    const unsubPubs = firebaseService.listenToPublications((livePubs) => {
      if (livePubs && Array.isArray(livePubs)) {
        const rehydrated = storageService.rehydratePublicationsWithLocalFiles(livePubs);
        setAllPublications(rehydrated);
        storageService.savePublications(rehydrated);
      }
    });

    // Auto-sync on window focus and every 20 seconds
    const interval = setInterval(performCloudSync, 20000);
    window.addEventListener('focus', performCloudSync);

    // 1. Hidden Keyboard Shortcut: Ctrl + Shift + A or Alt + A opens Admin Portal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || 
        (e.altKey && e.key.toLowerCase() === 'a')
      ) {
        e.preventDefault();
        setIsAdminPortalOpen(prev => !prev);
      }
    };

    // 2. Hidden URL route/hash: #admin opens Admin Portal
    const handleHashChange = () => {
      if (window.location.hash.toLowerCase() === '#admin') {
        setIsAdminPortalOpen(true);
      }
    };

    if (window.location.hash.toLowerCase() === '#admin') {
      setIsAdminPortalOpen(true);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      if (unsubPubs) unsubPubs();
      clearInterval(interval);
      window.removeEventListener('focus', performCloudSync);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const approvedPublications = allPublications.filter(p => p.status === 'approved');

  // Handlers
  const handleOpenSubmitModal = () => {
    if (!currentUser) {
      setAuthModalNotice('Please sign in or register an author account to submit a publication/blog.');
      setIsAuthModalOpen(true);
    } else {
      setIsSubmitModalOpen(true);
    }
  };

  const handleUserAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
    setUserNotifications(storageService.getNotifications(user.email));
    if (authModalNotice) {
      setAuthModalNotice('');
      setIsSubmitModalOpen(true);
    }
  };

  const handleUserLogout = () => {
    storageService.logoutUser();
    setCurrentUser(null);
    setUserNotifications([]);
    setIsDashboardOpen(false);
    setIsNotificationsModalOpen(false);
  };

  const handleOpenViewer = (pub: Publication) => {
    storageService.recordView(pub.id);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
    setViewingPublication(pub);
  };

  const handleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = storageService.toggleLikePublication(id);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
    if (viewingPublication && viewingPublication.id === id) {
      setViewingPublication({
        ...viewingPublication,
        likes: result.likes
      });
    }
  };

  const handleSubmitPublication = async (
    pubData: Omit<Publication, 'id' | 'status' | 'submittedAt' | 'views' | 'likes'>,
    rawFile?: File | null
  ) => {
    await storageService.submitPublication(pubData, rawFile || undefined);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
  };

  const handleApprove = (id: string) => {
    storageService.approvePublication(id);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
    if (currentUser?.email) {
      setUserNotifications(storageService.getNotifications(currentUser.email));
    }
  };

  const handleReject = (id: string, reason?: string) => {
    storageService.rejectPublication(id, reason);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
    if (currentUser?.email) {
      setUserNotifications(storageService.getNotifications(currentUser.email));
    }
  };

  const handleMarkNotificationAsRead = (id: string) => {
    storageService.markNotificationAsRead(id);
    if (currentUser?.email) {
      setUserNotifications(storageService.getNotifications(currentUser.email));
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    if (currentUser?.email) {
      storageService.markAllNotificationsAsRead(currentUser.email);
      setUserNotifications(storageService.getNotifications(currentUser.email));
    }
  };

  const handleDeleteNotification = (id: string) => {
    storageService.deleteNotification(id);
    if (currentUser?.email) {
      setUserNotifications(storageService.getNotifications(currentUser.email));
    }
  };

  const handleToggleFeature = (id: string) => {
    storageService.toggleFeature(id);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
  };

  const handleDelete = (id: string) => {
    storageService.deletePublication(id);
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
  };

  const handleResetSampleData = () => {
    storageService.resetToSampleData();
    const updated = storageService.getAllPublications();
    setAllPublications(updated);
  };

  const handleSaveDbConfig = (cfg: DatabaseConfig) => {
    storageService.saveDatabaseConfig(cfg);
    setDbConfig(cfg);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCloseAdminPortal = () => {
    setIsAdminPortalOpen(false);
    if (window.location.hash.toLowerCase() === '#admin') {
      window.history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  };

  const unreadNotifsCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col selection:bg-[#D95F7F] selection:text-white bg-[#FDF9F6]">
      {/* Navigation Header */}
      <Navbar
        onOpenSubmitModal={handleOpenSubmitModal}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        currentUser={currentUser}
        onOpenAuthModal={() => { setAuthModalNotice(''); setIsAuthModalOpen(true); }}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        unreadNotificationsCount={unreadNotifsCount}
        onOpenNotifications={() => setIsNotificationsModalOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-grow">
        <Hero
          onOpenSubmitModal={handleOpenSubmitModal}
          onExplorePublications={() => scrollToSection('publications')}
          onExploreAbout={() => scrollToSection('about')}
        />

        {/* About Sthree Shakthi Section */}
        <AboutSection />

        {/* 4 Core Pathways */}
        <TransformationsSection />

        {/* Community Publications & Blogs Feed */}
        <PublicationsFeed
          publications={approvedPublications}
          onOpenViewer={handleOpenViewer}
          onOpenSubmitModal={handleOpenSubmitModal}
          onLike={handleLike}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenSubmitModal={handleOpenSubmitModal}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
        setActiveSection={setActiveSection}
      />

      {/* Interactive Reader Modal */}
      <PublicationViewerModal
        publication={viewingPublication}
        onClose={() => setViewingPublication(null)}
        onLike={handleLike}
        isAdminView={isAdminPortalOpen}
      />

      {/* Submit Publication Modal */}
      <SubmitPublicationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSubmit={handleSubmitPublication}
        currentUser={currentUser}
      />

      {/* Contributor Dashboard Modal (Personal Submissions & Rejection Feedback) */}
      <ContributorDashboard
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        currentUser={currentUser}
        publications={allPublications}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onOpenViewer={handleOpenViewer}
        onLogout={handleUserLogout}
        onDeleteSubmission={handleDelete}
        notifications={userNotifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
      />

      {/* Standalone Notifications Modal */}
      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notifications={userNotifications}
        onMarkAsRead={handleMarkNotificationAsRead}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onOpenViewer={(pubId) => {
          const p = allPublications.find(pub => pub.id === pubId);
          if (p) handleOpenViewer(p);
        }}
        onOpenDashboard={() => setIsDashboardOpen(true)}
      />

      {/* Contributor Auth Modal (Register & Login) */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => { setIsAuthModalOpen(false); setAuthModalNotice(''); }}
        onSuccess={handleUserAuthSuccess}
        messageNotice={authModalNotice}
      />

      {/* Admin Moderation Portal (Hidden / Protected) */}
      <AdminPortal
        isOpen={isAdminPortalOpen}
        onClose={handleCloseAdminPortal}
        publications={allPublications}
        onApprove={handleApprove}
        onReject={handleReject}
        onToggleFeature={handleToggleFeature}
        onDelete={handleDelete}
        onOpenViewer={handleOpenViewer}
        onResetSampleData={handleResetSampleData}
      />

      {/* Database Settings Modal */}
      <DatabaseSettingsModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        config={dbConfig}
        onSaveConfig={handleSaveDbConfig}
      />
    </div>
  );
}

export default App;

