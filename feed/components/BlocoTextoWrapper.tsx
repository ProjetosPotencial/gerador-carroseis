/**
 * BlocoTextoWrapper — wrapper transparente que aplica translateY(offsetY)
 * em todos os filhos absolute, deslocando o bloco de texto inteiro
 * verticalmente. Usado em todos os templates Feed/Stories (v7.7.17).
 *
 * Como os filhos têm `position: absolute`, é necessário um container
 * com `position: absolute; inset: 0` pra criar um novo contexto de
 * posicionamento. O `transform: translateY(...)` move todos juntos.
 *
 * v7.7.21: pointer-events: none em ambos os divs pra eventos de mouse
 * (drag da foto) chegarem no FotoDraggable atrás. O texto é puramente
 * visual, não precisa de interatividade.
 */
import type { ReactNode } from "react";

interface BlocoTextoWrapperProps {
  offsetY?: number;
  escala: number;
  children: ReactNode;
}

export default function BlocoTextoWrapper({
  offsetY,
  escala,
  children,
}: BlocoTextoWrapperProps) {
  const offset = offsetY ?? 0;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        transform: offset !== 0 ? `translateY(${offset * escala}px)` : undefined,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}
