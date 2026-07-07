import { useState } from 'react';
import LinkedInCover from './LinkedInCover';

export default function CoverEditor() {
  const [numero, setNumero] = useState("49");
  const [titulo, setTitulo] = useState("Mercado B2C: o uso estratégico e consciente do parcelamento");
  const [legendaLinha1, setLegendaLinha1] = useState("Tecnologia que destrava");
  const [legendaLinha2, setLegendaLinha2] = useState("o seu dia a dia financeiro.");
  const [fotoUrl, setFotoUrl] = useState("/assets/94f0de88dd7da2aa7b58f6680bcc081b5b16c90f.png");

  return (
    <div className="w-full min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Editor de Capa LinkedIn</h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Número da Edição
            </label>
            <input
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="49"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Título Principal
            </label>
            <textarea
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mercado B2C: o uso estratégico e consciente do parcelamento"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Legenda - Linha 1
            </label>
            <input
              type="text"
              value={legendaLinha1}
              onChange={(e) => setLegendaLinha1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tecnologia que destrava"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Legenda - Linha 2
            </label>
            <input
              type="text"
              value={legendaLinha2}
              onChange={(e) => setLegendaLinha2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="o seu dia a dia financeiro."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              URL da Foto
            </label>
            <input
              type="text"
              value={fotoUrl}
              onChange={(e) => setFotoUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="URL da imagem"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <LinkedInCover
            numero={numero}
            titulo={titulo}
            legendaLinha1={legendaLinha1}
            legendaLinha2={legendaLinha2}
            fotoUrl={fotoUrl}
          />
        </div>
      </div>
    </div>
  );
}
