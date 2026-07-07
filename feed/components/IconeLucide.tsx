/**
 * IconeLucide — renderiza qualquer ícone do lucide-react dinamicamente
 * a partir do nome em PascalCase (ex: "RefreshCcw", "DollarSign").
 *
 * Usa lazy loading via React.lazy pra não inflar o bundle inicial.
 * O lucide-react inteiro só é baixado quando há ícone customizado.
 *
 * Se o nome não existir, faz fallback pra RefreshCcw.
 */
import { lazy, Suspense } from "react";
import { RefreshCcw } from "lucide-react";

interface IconeLucideProps {
  nome?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Cache de componentes já carregados pra não fazer múltiplos lazy do mesmo
const cacheIcones = new Map<string, React.ComponentType<IconeLucideProps>>();

function obterComponenteIcone(nome: string): React.ComponentType<IconeLucideProps> {
  if (cacheIcones.has(nome)) return cacheIcones.get(nome)!;

  const Componente = lazy(async () => {
    const lucide = await import("lucide-react");
    const C = (lucide as Record<string, unknown>)[nome];
    // Ícone pode ser function (lucide antigo) ou object forwardRef (lucide novo)
    const valido =
      typeof C === "function" ||
      (typeof C === "object" &&
        C !== null &&
        "$$typeof" in C &&
        "render" in C);
    if (valido) {
      return { default: C as React.ComponentType<IconeLucideProps> };
    }
    // Fallback se nome inválido
    return { default: RefreshCcw as unknown as React.ComponentType<IconeLucideProps> };
  });

  cacheIcones.set(nome, Componente);
  return Componente;
}

export default function IconeLucide({
  nome = "RefreshCcw",
  size = 24,
  strokeWidth = 2,
  color,
  className,
  style,
}: IconeLucideProps) {
  // Default RefreshCcw é direto importado (sem lazy) pra performance
  if (nome === "RefreshCcw") {
    return (
      <RefreshCcw
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
        style={style}
      />
    );
  }

  const Componente = obterComponenteIcone(nome);

  return (
    <Suspense
      fallback={
        <RefreshCcw
          size={size}
          strokeWidth={strokeWidth}
          color={color}
          className={className}
          style={style}
        />
      }
    >
      <Componente
        size={size}
        strokeWidth={strokeWidth}
        color={color}
        className={className}
        style={style}
      />
    </Suspense>
  );
}
