import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { Status } from "./useStatus";

export default function StatusBar({
  status,
  onDismiss,
}: {
  status: Status;
  onDismiss: () => void;
}) {
  if (status.tipo === "idle") return null;

  const configs = {
    exportando: {
      cor: "bg-[#FFC528]/10 border-[#FFC528]/40 text-[#FFC528]",
      icone: <Loader2 size={16} className="animate-spin" />,
      texto:
        status.tipo === "exportando"
          ? `Gerando slide ${status.atual} de ${status.total}...`
          : "",
    },
    sucesso: {
      cor: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400",
      icone: <CheckCircle2 size={16} />,
      texto: status.tipo === "sucesso" ? status.msg : "",
    },
    erro: {
      cor: "bg-red-500/10 border-red-500/40 text-red-400",
      icone: <AlertCircle size={16} />,
      texto: status.tipo === "erro" ? status.msg : "",
    },
    idle: { cor: "", icone: null, texto: "" },
  };

  const cfg = configs[status.tipo];
  return (
    <div
      className={`flex items-center justify-between gap-3 border rounded-lg px-4 py-2.5 text-sm ${cfg.cor}`}
      role="status"
    >
      <div className="flex items-center gap-2 font-medium">
        {cfg.icone}
        <span>{cfg.texto}</span>
      </div>
      {status.tipo !== "exportando" && (
        <button onClick={onDismiss} className="text-xs opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}
