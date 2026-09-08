import { useState, useRef, useEffect } from "react";
import { Check, ImageIcon, Shuffle, Upload, X } from "lucide-react";

interface UnsplashSearchProps {
  onSelectImage: (url: string, index: number) => void;
  grupoIndex: number;
  /** URL atualmente selecionada (para marcar visualmente) */
  valorAtual?: string;
}

/**
 * Banco expandido de imagens do Unsplash por categoria.
 * Cada categoria tem 10 imagens — o grid mostra 4 sorteadas aleatoriamente
 * e o botão "Sortear outras" gira as 4 visíveis.
 */
const imagensSugeridas = {
  business: [
    "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=1200&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80",
    "https://images.unsplash.com/photo-1664575602276-acd073f104c1?w=1200&q=80",
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&q=80",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&q=80",
    "https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=1200&q=80",
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80",
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80",
    "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80",
  ],
  people: [
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80",
    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1200&q=80",
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&q=80",
    "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&q=80",
    "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=1200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=1200&q=80",
  ],
  office: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1200&q=80",
    "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80",
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&q=80",
    "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=1200&q=80",
    "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=1200&q=80",
    "https://images.unsplash.com/photo-1631014517840-06fdadd2a00a?w=1200&q=80",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80",
    "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=1200&q=80",
  ],
  finance: [
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80",
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1200&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
    "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&q=80",
    "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?w=1200&q=80",
    "https://images.unsplash.com/photo-1591696205602-2f950c417cb9?w=1200&q=80",
    "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1200&q=80",
    "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&q=80",
    "https://images.unsplash.com/photo-1633158829875-e5316a358c6f?w=1200&q=80",
  ],
};

const labels: Record<keyof typeof imagensSugeridas, string> = {
  business: "Negócios",
  technology: "Tecnologia",
  people: "Pessoas",
  office: "Escritório",
  finance: "Finanças",
};

const VISIVEIS = 4; // quantas imagens do banco mostrar por vez no grid

/** Sorteia N elementos distintos de um array (Fisher-Yates parcial). */
function sortear<T>(arr: T[], n: number): T[] {
  const copia = [...arr];
  const resultado: T[] = [];
  const alvo = Math.min(n, copia.length);
  for (let i = 0; i < alvo; i++) {
    const idx = Math.floor(Math.random() * copia.length);
    resultado.push(copia.splice(idx, 1)[0]);
  }
  return resultado;
}

export default function UnsplashSearch({
  onSelectImage,
  grupoIndex,
  valorAtual,
}: UnsplashSearchProps) {
  const [categoria, setCategoria] = useState<keyof typeof imagensSugeridas>("business");
  const [visiveis, setVisiveis] = useState<string[]>(() =>
    imagensSugeridas.business.slice(0, VISIVEIS)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [erroUpload, setErroUpload] = useState<string | null>(null);

  // Quando troca categoria, atualiza as imagens visíveis
  useEffect(() => {
    setVisiveis(imagensSugeridas[categoria].slice(0, VISIVEIS));
  }, [categoria]);

  const sortearNovas = () => {
    setVisiveis(sortear(imagensSugeridas[categoria], VISIVEIS));
  };

  const selecionar = (url: string) => {
    onSelectImage(url, grupoIndex);
  };

  /** Upload de imagem local → converte pra data URL base64 */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErroUpload(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação: tamanho máx 5MB
    const MAX_MB = 5;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErroUpload(`Arquivo muito grande. Máximo ${MAX_MB}MB.`);
      return;
    }

    // Validação: tipo
    if (!file.type.startsWith("image/")) {
      setErroUpload("Arquivo deve ser uma imagem.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onSelectImage(dataUrl, grupoIndex);
    };
    reader.onerror = () => {
      setErroUpload("Não foi possível ler o arquivo.");
    };
    reader.readAsDataURL(file);

    // reset do input pra permitir re-upload do mesmo arquivo
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const isUpload = valorAtual?.startsWith("data:");

  return (
    <div className="bg-[#0f0f0f] rounded-lg border border-gray-800 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ImageIcon size={14} className="text-gray-400" />
          <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Imagem do bloco
          </h4>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-all border border-gray-800"
          title="Enviar imagem do seu computador"
        >
          <Upload size={12} />
          Enviar imagem
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* Feedback de upload */}
      {isUpload && (
        <div className="flex items-center justify-between gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-md px-2.5 py-1.5 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Check size={12} strokeWidth={3} />
            Imagem local em uso
          </span>
          <button
            type="button"
            onClick={() => selecionar(imagensSugeridas[categoria][0])}
            className="text-gray-400 hover:text-white"
            title="Remover imagem local"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {erroUpload && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-md px-2.5 py-1.5 text-xs text-red-400">
          {erroUpload}
        </div>
      )}

      {/* Chips de categoria */}
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(imagensSugeridas) as Array<keyof typeof imagensSugeridas>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategoria(key)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              categoria === key
                ? "bg-[#FFC528] text-black"
                : "bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
            }`}
          >
            {labels[key]}
          </button>
        ))}
      </div>

      {/* Grid + botão sortear */}
      <div className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {visiveis.map((url, idx) => {
            const selecionada = valorAtual === url;
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                className="relative group aspect-[4/3] rounded-md overflow-hidden border-2 border-transparent hover:border-[#FFC528] transition-all focus:outline-none focus:border-[#FFC528]"
                onClick={() => selecionar(url)}
                aria-label={`Selecionar imagem ${idx + 1} de ${labels[categoria]}`}
              >
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                {selecionada && (
                  <div className="absolute inset-0 bg-[#FFC528]/30 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[#FFC528] flex items-center justify-center">
                      <Check size={18} className="text-black" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={sortearNovas}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-all border border-gray-800"
          title="Sortear outras imagens dessa categoria"
        >
          <Shuffle size={12} />
          Sortear outras opções
        </button>
      </div>

      <p className="text-[10px] text-gray-600">
        Imagens do Unsplash · uso gratuito comercial · ou envie a sua
      </p>
    </div>
  );
}
