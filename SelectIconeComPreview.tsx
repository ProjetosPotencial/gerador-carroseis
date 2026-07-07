import * as LucideIcons from "lucide-react";

/**
 * Lista centralizada dos ícones disponíveis.
 * Adicionar novos aqui faz o select aparecer automaticamente.
 */
export const iconesDisponiveis = {
  CreditCard: LucideIcons.CreditCard,
  Wallet: LucideIcons.Wallet,
  TrendingUp: LucideIcons.TrendingUp,
  DollarSign: LucideIcons.DollarSign,
  Sparkles: LucideIcons.Sparkles,
  Target: LucideIcons.Target,
  BarChart3: LucideIcons.BarChart3,
  PieChart: LucideIcons.PieChart,
  ShoppingCart: LucideIcons.ShoppingCart,
  Store: LucideIcons.Store,
  Zap: LucideIcons.Zap,
  TrendingDown: LucideIcons.TrendingDown,
  LayoutDashboard: LucideIcons.LayoutDashboard,
  Megaphone: LucideIcons.Megaphone,
  Lightbulb: LucideIcons.Lightbulb,
  Rocket: LucideIcons.Rocket,
  Users: LucideIcons.Users,
  ShieldCheck: LucideIcons.ShieldCheck,
  Lock: LucideIcons.Lock,
  Unlock: LucideIcons.Unlock,
};

export type IconeNome = keyof typeof iconesDisponiveis;

interface SelectIconeComPreviewProps {
  valor: string;
  onChange: (novoIcone: string) => void;
  id?: string;
  tamanhoPreview?: "pequeno" | "medio";
}

/**
 * Select de ícone + card de preview ao lado.
 * Mostra visualmente o ícone selecionado no mesmo estilo do card da capa final.
 */
export default function SelectIconeComPreview({
  valor,
  onChange,
  id,
  tamanhoPreview = "medio",
}: SelectIconeComPreviewProps) {
  const IconeComponente =
    iconesDisponiveis[valor as IconeNome] ?? iconesDisponiveis.CreditCard;

  const dimensao = tamanhoPreview === "pequeno" ? 36 : 44;
  const iconeTam = tamanhoPreview === "pequeno" ? 20 : 24;

  return (
    <div className="flex gap-2 items-stretch">
      <select
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="input-base flex-1"
        aria-label="Selecionar ícone"
      >
        {(Object.keys(iconesDisponiveis) as IconeNome[]).map((nome) => (
          <option key={nome} value={nome}>
            {nome}
          </option>
        ))}
      </select>

      {/* Preview do ícone no mesmo estilo do card amarelo da capa */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-md bg-[#ffe8a4] border border-[#e5b82e]/30"
        style={{ width: dimensao, height: dimensao }}
        title={`Preview: ${valor}`}
        aria-label={`Preview do ícone ${valor}`}
      >
        <IconeComponente size={iconeTam} strokeWidth={1.6} color="#371B01" />
      </div>
    </div>
  );
}
