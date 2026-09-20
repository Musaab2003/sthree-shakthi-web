import React from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  ExternalLink,
  ArrowRight,
  Sparkles,
  MessageSquareWarning,
  Clock
} from 'lucide-react';
import { UserNotification, Publication } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onOpenViewer?: (pubId: string) => void;
  onOpenDashboard?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onOpenViewer,
  onOpenDashboard
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHrs = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHrs / 24);

      if (diffMin < 2) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHrs < 24) return `${diffHrs}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#3E1028]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl max-h-[88vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-[#F4E5DA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F4E5DA] bg-[#FAF2EB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#D95F7F] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-base font-bold text-[#3E1028]">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold shadow-2xs">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[#5C1D3B]/70">
                Editorial feedback & status updates on your publications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-slate-100 text-[#5C1D3B] text-[11px] font-bold border border-[#F4E5DA] transition-all cursor-pointer shadow-2xs"
                title="Mark all notifications as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-[#FDF9F6]">
          {notifications.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FAF2EB] text-[#D95F7F] flex items-center justify-center mx-auto border border-[#F4E5DA]">
                <Bell className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="font-serif text-base font-bold text-[#3E1028]">No Notifications Yet</h3>
              <p className="text-xs text-[#5C1D3B]/70 max-w-xs mx-auto">
                When the editorial board reviews, approves, or provides revision notes on your publications, notifications will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isRejection = notif.type === 'rejection';
              const isApproval = notif.type === 'approval';

              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && onMarkAsRead(notif.id)}
                  className={`p-4 rounded-2xl border transition-all relative group ${
                    notif.read 
                      ? 'bg-white border-[#F4E5DA]' 
                      : isRejection 
                        ? 'bg-rose-50/60 border-rose-300 ring-1 ring-rose-300/40 shadow-xs' 
                        : 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-300/40 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon indicator */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                      isRejection 
                        ? 'bg-rose-600 text-white' 
                        : isApproval 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-[#D95F7F] text-white'
                    }`}>
                      {isRejection ? (
                        <MessageSquareWarning className="w-4 h-4" />
                      ) : isApproval ? (
                        <Sparkles className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Notification content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            isRejection 
                              ? 'bg-rose-100 text-rose-800' 
                              : isApproval 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-800'
                          }`}>
                            {isRejection ? 'Needs Revision' : isApproval ? 'Approved' : 'Notice'}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Unread" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notif.createdAt)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notif.id);
                            }}
                            className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="font-serif text-sm font-bold text-[#3E1028]">
                        {notif.title}
                      </h4>

                      <p className="text-xs text-[#5C1D3B]/80 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Editorial Feedback Reason Box for Rejection */}
                      {isRejection && notif.feedbackReason && (
                        <div className="p-3 rounded-xl bg-white border border-rose-200 text-rose-950 text-xs space-y-1 shadow-2xs">
                          <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                            <span>Editorial Board Feedback</span>
                          </div>
                          <p className="italic text-slate-700 bg-rose-50/50 p-2 rounded-lg border-l-2 border-rose-400">
                            "{notif.feedbackReason}"
                          </p>
                        </div>
                      )}

                      {/* Action Links */}
                      <div className="pt-1 flex items-center gap-2">
                        {isApproval && onOpenViewer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenViewer(notif.publicationId);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#D95F7F] hover:bg-[#BE4465] text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span>View Live Publication</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}

                        {isRejection && onOpenDashboard && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenDashboard();
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#3E1028] hover:bg-[#5C1D3B] text-white text-[10px] font-bold transition-all shadow-xs cursor-pointer"
                          >
                            <span>Open in Dashboard</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF2EB] border-t border-[#F4E5DA] flex items-center justify-between text-xs text-[#5C1D3B]/70">
          <span>{notifications.length} total notification{notifications.length === 1 ? '' : 's'}</span>
          {onOpenDashboard && (
            <button
              onClick={() => { onOpenDashboard(); onClose(); }}
              className="text-[#D95F7F] font-bold hover:underline cursor-pointer"
            >
              Go to Contributor Dashboard →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
