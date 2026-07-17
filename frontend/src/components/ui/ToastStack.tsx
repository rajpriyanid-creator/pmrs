import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { useToastStore } from "../../store/toastStore";

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONES = { success: "border-verdant text-verdant", error: "border-flag text-flag", info: "border-seal text-seal" };

/**
 * The second "purposeful transition" moment called out in Section 2's tech
 * stack table (rail + save flows): a brief, un-intrusive confirmation on
 * every successful write - not a full-screen spinner, not a jarring alert.
 */
export function ToastStack() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`flex items-center gap-2 rounded-lg border bg-paper px-4 py-2.5 text-sm shadow-md ${TONES[t.tone]}`}
            >
              <motion.span initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ delay: 0.05, duration: 0.25, ease: "backOut" }}>
                <Icon size={16} />
              </motion.span>
              <span className="text-ink">{t.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
