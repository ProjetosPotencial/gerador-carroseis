/**
 * Logo Parcele Aqui — pin amarelo dobrado com círculo preto.
 * SVG oficial fornecido pelo cliente.
 *
 * Composição: 3 paths
 *  - Amarelo (#FFCC1B) — corpo principal do pin "etiqueta"
 *  - Preto (#1C1815) — círculo com furo (parte gráfica do "P")
 *  - Sombra/dobra (#DAA500) — vinco da parte dobrada
 */
export default function LogoParceleAqui({
  tamanho = 64,
  cor = "#FFCC1B",
  corCirculo = "#1C1815",
  corSombra = "#DAA500",
}: {
  tamanho?: number;
  cor?: string;
  corCirculo?: string;
  corSombra?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={(tamanho * 88) / 104}
      viewBox="0 0 104 88"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block" }}
    >
      <path
        d="M31.6518 70.3883V35.1941C31.6518 28.7868 33.4229 22.7851 36.4965 17.6074H9.19506C4.11392 17.6074 0 21.6141 0 26.5534V79.054C0 83.9933 4.11392 88 9.19506 88H54.1129C59.1897 88 63.3079 83.9975 63.3079 79.054V70.3883H31.6561H31.6518Z"
        fill={cor}
      />
      <path
        d="M67.8255 0C47.8491 0 31.6514 15.7548 31.6514 35.1942V70.3884H67.8255C87.8019 70.3884 104 54.6294 104 35.1942C104 15.759 87.8019 0 67.8255 0ZM67.8384 52.7808C57.8481 52.7808 49.7535 44.9014 49.7535 35.1858C49.7535 25.4703 57.8524 17.5908 67.8384 17.5908C77.8244 17.5908 85.9233 25.4703 85.9233 35.1858C85.9233 44.9014 77.8244 52.7808 67.8384 52.7808Z"
        fill={corCirculo}
      />
      <path
        d="M63.3032 70.3887H31.6514L61.7986 83.9519C62.7486 82.5425 63.3032 80.8654 63.3032 79.0544V70.3887Z"
        fill={corSombra}
      />
    </svg>
  );
}
