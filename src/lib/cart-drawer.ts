import { useEffect, useState } from "react";

const OPEN = "cart-drawer:open";
const CLOSE = "cart-drawer:close";

export const cartDrawer = {
  open() {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN));
  },
  close() {
    if (typeof window !== "undefined") window.dispatchEvent(new Event(CLOSE));
  },
};

export function useCartDrawerState() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    window.addEventListener(OPEN, onOpen);
    window.addEventListener(CLOSE, onClose);
    return () => {
      window.removeEventListener(OPEN, onOpen);
      window.removeEventListener(CLOSE, onClose);
    };
  }, []);
  return [open, setOpen] as const;
}
