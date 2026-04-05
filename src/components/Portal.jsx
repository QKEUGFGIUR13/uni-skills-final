import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children, wrapperId = 'portal-root' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const portalRoot = document.createElement('div');
    portalRoot.id = wrapperId;
    document.body.appendChild(portalRoot);

    return () => {
      document.body.removeChild(portalRoot);
    };
  }, [wrapperId]);

  return mounted ? createPortal(children, document.getElementById(wrapperId)) : null;
};

export default Portal;
