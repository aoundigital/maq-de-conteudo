import React, { useState } from 'react';
import { Search, Filter, Download, Trash2, FileArchive } from 'lucide-react';
import { HistoryItem } from '../types';
import { formatDate } from '../lib/utils';
import JSZip from 'jszip';

interface HistoryProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
}

export default function History({ items, onDelete }: HistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('Todos');

  const clients = ['Todos', ...Array.from(new Set(items.map(i => i.clientName)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.mainKeyword.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'Todos' || item.clientName === clientFilter;
    return matchesSearch && matchesClient;
  });

  const handleDownload = async (item: HistoryItem) => {
    const zip = new JSZip();
    item.articles.forEach(art => {
      zip.file(art.filename, art.content);
    });
    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = item.zipName;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8">
      <section className="mb-12">
        <h2 className="font-serif text-4xl md:text-5xl text-on-surface mb-2 tracking-tight">Arquivo Editorial</h2>
        <p className="text-on-surface-variant max-w-2xl">
          Gerencie sua produção intelectual. Filtre por cliente, data ou status para manter o fluxo de trabalho organizado e eficiente.
        </p>
      </section>

      <section className="mb-8 bg-surface-container-low rounded-xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row gap-4 items-end">
        <div className="w-full md:flex-1 space-y-2">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider ml-1">Buscar Artigos</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
            <input
              className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary rounded-lg text-sm transition-all shadow-sm"
              placeholder="Título do conteúdo ou palavras-chave..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <label className="block text-xs font-bold text-secondary uppercase tracking-wider ml-1">Cliente</label>
          <select
            className="w-full py-3 px-4 bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary rounded-lg text-sm shadow-sm appearance-none cursor-pointer"
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
          >
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button className="w-full md:w-auto px-6 py-3 bg-primary text-on-primary rounded-lg font-medium text-sm hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
          <Filter className="w-4 h-4" />
          Filtrar
        </button>
      </section>

      <div className="mb-12">
        {/* Desktop View */}
        <div className="hidden md:block overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-secondary text-xs uppercase tracking-widest font-bold">
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Cliente / Pauta</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Volume</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-6 py-5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-tight">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Concluído
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="font-serif text-lg text-on-surface font-semibold group-hover:text-primary transition-colors">
                      {item.mainKeyword}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.clientName}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">{formatDate(item.date)}</td>
                  <td className="px-6 py-5 text-sm text-on-surface-variant">{item.quantity} Artigos</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all active:scale-90"
                        title="Baixar ZIP"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all active:scale-90"
                        title="Excluir"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-outline">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border-l-4 border-primary">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary py-1 px-2 bg-primary/10 rounded-full">Concluído</span>
                <span className="text-xs text-on-surface-variant">{formatDate(item.date)}</span>
              </div>
              <h3 className="font-serif text-xl text-on-surface mb-1 leading-tight">{item.mainKeyword}</h3>
              <p className="text-sm text-on-surface-variant mb-4">Cliente: {item.clientName} • {item.quantity} Artigos</p>
              <div className="flex items-center justify-between pt-4 border-t border-surface-container">
                <button
                  onClick={() => handleDownload(item)}
                  className="flex items-center gap-1 text-primary font-bold text-xs"
                >
                  <FileArchive className="w-4 h-4" />
                  ZIP
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 font-bold text-xs flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  EXCLUIR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
