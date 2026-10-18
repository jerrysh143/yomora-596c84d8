import { useQuery } from "@tanstack/react-query";
import { siteContentQuery } from "@/lib/site-content.queries";
import { YOMORA_PHONE_DIGITS } from "@/lib/contact-details";

export function whatsappHref(number: string, message?: string) {
  const digits = number.replace(/\D/g, "") || YOMORA_PHONE_DIGITS;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

export function useWhatsappNumber() {
  const { data } = useQuery(siteContentQuery());
  return data?.cta_strip?.whatsapp_number || YOMORA_PHONE_DIGITS;
}

export function WhatsappIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
    </svg>
  );
}

/** Floating WhatsApp chat button for storefront pages. */
export function WhatsappButton() {
  const number = useWhatsappNumber();
  return (
    <a
      href={whatsappHref(number, "Hi YOMORA, I have a question about a piece.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with YOMORA on WhatsApp"
      className="wa-fab fixed bottom-4 right-4 z-[70] flex items-center gap-2 rounded-full bg-[#1f7a4d] p-3.5 text-white shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition-transform hover:scale-105 md:bottom-6 md:right-6 md:px-5 md:py-3"
    >
      <WhatsappIcon className="h-6 w-6" />
      <span className="hidden text-sm font-semibold md:inline">Chat on WhatsApp</span>
    </a>
  );
}
