import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  duration?: number;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ 
  message, 
  type, 
  duration = 5000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Utiliser requestAnimationFrame au lieu de setTimeout pour l'animation
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            onClose?.();
          });
        });
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    // Utiliser requestAnimationFrame au lieu de setTimeout pour l'animation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        onClose?.();
      });
    });
  };

  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const Icon = icons[type];

  if (!isVisible) return null;

  return (
    <div 
      className={`p-3 sm:p-4 rounded-lg shadow-lg border-2 ${colors[type]} transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium whitespace-pre-line break-words">{message}</p>
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-1"
        >
          <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

interface NotificationManagerProps {
  notifications: Array<{ id: string; message: string; type: NotificationType }>;
  onRemove: (id: string) => void;
}

export const NotificationManager: React.FC<NotificationManagerProps> = ({ 
  notifications, 
  onRemove 
}) => {
  return (
    <div className="fixed top-2 sm:top-4 right-2 sm:right-4 z-50 space-y-2 max-w-[90vw] sm:max-w-md">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

