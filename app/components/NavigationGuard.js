'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import ConfirmationDialog from './ConfirmationDialog';

/**
 * NavigationGuard component to prevent accidental navigation away from forms with unsaved changes
 * 
 * @param {Object} props
 * @param {boolean} props.isDirty - Whether there are unsaved changes
 * @param {string} props.message - Message to show in confirmation dialog
 */
const NavigationGuard = ({ 
  isDirty = false, 
  message = "You have unsaved changes. Are you sure you want to leave this page?"
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [pendingPath, setPendingPath] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const isNavigatingRef = useRef(false);

  // Handle browser navigation and tab/window closing
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        console.log('beforeunload triggered, form is dirty');
        // Standard way of showing a confirmation dialog before page unload
        const confirmationMessage = message;
        e.preventDefault();
        e.returnValue = confirmationMessage; // This is needed for Chrome
        return confirmationMessage; // This is needed for other browsers
      }
    };

    // Add the beforeunload event listener
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, message]);

  // Update previous pathname when current pathname changes
  useEffect(() => {
    if (!isNavigatingRef.current) {
      setPrevPathname(pathname);
    }
  }, [pathname]);

  // Function to intercept Next.js navigation
  const handleNavigation = useCallback(() => {
    // Add the interceptor on window click events for all anchor tags
    const handleLinkClick = (e) => {
      // Check if the click is on an anchor tag
      let target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentNode;
        if (!target) break;
      }

      // If we found an anchor tag with href
      if (target && target.href && !target.getAttribute('href').startsWith('#')) {
        if (isDirty && !isNavigatingRef.current) {
          try {
            // Get the pathname from the href
            const url = new URL(target.href);
            const nextPathname = url.pathname;
            
            // Only prompt if navigating to a different page
            if (nextPathname !== pathname) {
              e.preventDefault();
              e.stopPropagation();
              
              // Set the pending path and show dialog
              setPendingPath(nextPathname);
              setShowDialog(true);
              isNavigatingRef.current = true;
              
              return false;
            }
          } catch (error) {
            console.error('Error in navigation guard:', error);
          }
        }
      }
    };

    // Add the interceptor
    document.addEventListener('click', handleLinkClick, true);
    
    // Clean up
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
    };
  }, [isDirty, pathname]);

  // Set up the navigation interceptor
  useEffect(() => {
    const cleanup = handleNavigation();
    return cleanup;
  }, [handleNavigation]);

  // Function to handle confirmed navigation
  const handleConfirmNavigation = () => {
    if (pendingPath) {
      console.log('Confirmed navigation to:', pendingPath);
      // Use setTimeout to ensure the dialog is closed first before navigating
      setTimeout(() => {
        window.location.href = pendingPath;
      }, 50);
    }
  };

  // Function to handle dialog close without confirmation
  const handleCloseDialog = () => {
    setShowDialog(false);
    isNavigatingRef.current = false;
    setPendingPath(null);
  };

  console.log('NavigationGuard state:', { 
    isDirty, 
    showDialog, 
    pendingPath, 
    pathname, 
    prevPathname,
    isNavigating: isNavigatingRef.current 
  });

  return (
    <ConfirmationDialog
      isOpen={showDialog}
      onClose={handleCloseDialog}
      onConfirm={handleConfirmNavigation}
      title="Unsaved Changes"
      message={message}
      confirmText="Yes, leave page"
      cancelText="No, stay here"
    />
  );
};

export default NavigationGuard; 