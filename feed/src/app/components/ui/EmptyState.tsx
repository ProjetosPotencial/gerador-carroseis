/**
 * EmptyState — componente de estado vazio com ilustração e CTA.
 * Usado quando não há slides, capas ou conteúdo.
 */
import React from "react";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  illustration?: "carousel" | "batch" | "cover";
}

// Ilustrações SVG inline minimalistas e animadas
function IllustrationCarousel() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="10" y="20" width="24" height="40" rx="3" fill="var(--v6-bg-sunken)" stroke="var(--v6-border)" strokeWidth="1.5"/>
      <rect x="28" y="14" width="24" height="52" rx="3" fill="var(--v6-bg-elevated)" stroke="#FFC528" strokeWidth="1.5"/>
      <rect x="46" y="20" width="24" height="40" rx="3" fill="var(--v6-bg-sunken)" stroke="var(--v6-border)" strokeWidth="1.5"/>
      <line x1="34" y1="28" x2="46" y2="28" stroke="#FFC528" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="34" y1="36" x2="46" y2="36" stroke="var(--v6-border)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="34" y1="43" x2="43" y2="43" stroke="var(--v6-border)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IllustrationBatch() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="12" y="28" width="44" height="32" rx="3" fill="var(--v6-bg-sunken)" stroke="var(--v6-border)" strokeWidth="1.5"/>
      <rect x="16" y="22" width="44" height="32" rx="3" fill="var(--v6-bg-elevated)" stroke="var(--v6-border)" strokeWidth="1.5"/>
      <rect x="20" y="16" width="44" height="32" rx="3" fill="var(--v6-bg-raised)" stroke="#FFC528" strokeWidth="1.5"/>
      <line x1="28" y1="26" x2="52" y2="26" stroke="#FFC528" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="28" y1="33" x2="48" y2="33" stroke="var(--v6-border)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IllustrationCover() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
      <rect x="8" y="24" width="64" height="36" rx="4" fill="var(--v6-bg-sunken)" stroke="#FFC528" strokeWidth="1.5"/>
      <rect x="8" y="24" width="22" height="36" rx="4" fill="var(--v6-bg-elevated)" stroke="var(--v6-border)" strokeWidth="1.5"/>
      <rect x="14" y="35" width="10" height="10" rx="2" fill="#FFC528"/>
      <line x1="36" y1="34" x2="64" y2="34" stroke="var(--v6-border)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="36" y1="42" x2="60" y2="42" stroke="var(--v6-border)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

const illustrations = {
  carousel: <IllustrationCarousel />,
  batch: <IllustrationBatch />,
  cover: <IllustrationCover />,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* Ilustração */}
      <div className="mb-5 opacity-70">
        {icon ?? (illustration ? illustrations[illustration] : <IllustrationCarousel />)}
      </div>

      {/* Texto */}
      <h3 className="text-base font-bold text-[var(--v6-text-primary)] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--v6-text-muted)] max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}

      {/* Ações */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                bg-[#FFC528] text-black hover:bg-[#FFD55A] active:bg-[#E5AC14]
                transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {action.icon}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                bg-[var(--v6-bg-sunken)] border border-[var(--v6-border)]
                text-[var(--v6-text-secondary)] hover:text-[var(--v6-text-primary)]
                hover:border-[var(--v6-border)] transition-all"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
