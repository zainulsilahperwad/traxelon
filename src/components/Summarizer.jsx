import React from 'react';
import { BrainCircuit, Globe, Smartphone, Monitor, Activity, Fingerprint, Download, Cpu, MapPin, Navigation } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Summarizer = ({ captures }) => {
  if (!captures || captures.length === 0) return null;

  const analyzeIntelligence = () => {
    const total = captures.length;
    const stats = { browsers: {}, oss: {}, devices: {}, regions: {}, isBot: 0 };

    captures.forEach(c => {
      stats.browsers[c.browser] = (stats.browsers[c.browser] || 0) + 1;
      stats.oss[c.os] = (stats.oss[c.os] || 0) + 1;
      stats.devices[c.device] = (stats.devices[c.device] || 0) + 1;
      if (c.region) stats.regions[c.region] = (stats.regions[c.region] || 0) + 1;
      
      const isBotUA = c.browser?.toLowerCase().includes('bot') || c.browser === 'Unknown';
      if (isBotUA) stats.isBot++;
    });

    const getTop = (obj) => {
      const keys = Object.keys(obj);
      return keys.length ? keys.reduce((a, b) => obj[a] > obj[b] ? a : b) : "Unknown";
    };
    
    const botPct = Math.round((stats.isBot / total) * 100);
    return { 
      total, 
      topOS: getTop(stats.oss), 
      topDevice: getTop(stats.devices), 
      topBrowser: getTop(stats.browsers),
      topRegion: getTop(stats.regions),
      botPct 
    };
  };

  const data = analyzeIntelligence();

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const timestamp = new Date().toLocaleString();

    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 297, 45, 'F');
    doc.setTextColor(56, 189, 248);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("TRAXELON FORENSIC INTELLIGENCE REPORT", 15, 25);
    
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`REPORT ID: TRX-${Math.random().toString(36).toUpperCase().substring(2, 10)} | GENERATED: ${timestamp}`, 15, 35);

    doc.setTextColor(242, 242, 242);
    doc.setFontSize(70);
    doc.text("CONFIDENTIAL", 50, 160, { angle: 35 });

    const tableRows = captures.map((c, i) => [
      i + 1,
      c.ip,
      `${c.isp || 'N/A'}\nASN: ${c.asn || 'N/A'}`,
      `${c.city || 'N/A'}\n${c.region || 'N/A'}, ${c.country || 'N/A'}`,
      `${c.gpsCoords || 'N/A'}\nAcc: ${c.accuracy || 'N/A'}m`,
      `${c.os} / ${c.browser}\n${c.device}`,
      `${c.gpu || 'N/A'}\n${c.gpuVendor || 'N/A'}`,
      `${c.resolution || 'N/A'}\nHash: ${c.canvasHash?.substring(0,6) || 'N/A'}`
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['ID', 'IP ADDRESS', 'ISP / ASN', 'LOCATION', 'GPS COORDS', 'SYSTEM/OS', 'GPU INFO', 'HARDWARE']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [56, 189, 248], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2, fillColor: null }, 
      columnStyles: { 0: { cellWidth: 8 }, 1: { fontStyle: 'bold' }, 4: { textColor: [220, 38, 38] } }
    });

    doc.save(`Traxelon_Forensic_${Date.now()}.pdf`);
  };

  return (
    <div className="bg-surface-elevated border border-primary/30 rounded-xl overflow-hidden mb-6 shadow-2xl transition-all">
      <div className="bg-primary/10 px-4 py-3 border-b border-primary/20 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-bold tracking-[0.3em] text-primary uppercase">Forensic Intelligence Log</span>
        </div>
        <button 
          onClick={exportToPDF}
          className="group flex items-center gap-2 px-3 py-1.5 rounded bg-primary text-surface text-[10px] font-bold hover:brightness-110 transition-all active:scale-95"
        >
          <Download className="w-3 h-3" /> EXPORT DOSSIER
        </button>
      </div>

      <div className="p-5 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface border border-surface-border p-3 rounded">
            <span className="text-[8px] text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Activity className="w-3 h-3" /> Signals</span>
            <span className="text-sm font-display text-text-primary uppercase">{data.total}</span>
          </div>
          <div className="bg-surface border border-surface-border p-3 rounded">
            <span className="text-[8px] text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1">
                {data.topDevice === 'Mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />} Device
            </span>
            <span className="text-sm font-display text-text-primary uppercase">{data.topDevice}</span>
          </div>
          <div className="bg-surface border border-surface-border p-3 rounded">
            <span className="text-[8px] text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Cpu className="w-3 h-3" /> Architecture</span>
            <span className="text-sm font-display text-text-primary uppercase">{data.topOS}</span>
          </div>
          <div className="bg-surface border border-surface-border p-3 rounded">
            <span className="text-[8px] text-text-muted uppercase tracking-widest mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> Sector</span>
            <span className="text-sm font-display text-text-primary uppercase">{data.topRegion}</span>
          </div>
        </div>

        <div className="space-y-4">
          {captures.map((cap, i) => (
            <div key={i} className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-4 hover:border-primary/20 transition-colors">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-mono font-bold text-xs">SIGNAL #{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-[9px] text-text-muted">{new Date(cap.timestamp || Date.now()).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-[9px] text-primary/70 font-mono">
                  <Fingerprint className="w-3 h-3" /> {cap.canvasHash?.substring(0, 12)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[10px] font-mono leading-relaxed">
                <div className="space-y-1">
                  <div className="text-primary/50 uppercase text-[8px] mb-1 tracking-widest">Network Data</div>
                  <div className="text-text-primary font-bold">IP: {cap.ip}</div>
                  <div className="text-text-secondary line-clamp-1">ISP: {cap.isp}</div>
                  <div className="text-text-muted">ASN: {cap.asn}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-primary/50 uppercase text-[8px] mb-1 tracking-widest flex justify-between items-center">
                    <span>GPS & Geolocation</span>
                    {cap.gpsCoords && (
                        <a 
                          href={`https://maps.google.com/?q=${cap.gpsCoords}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-primary flex items-center gap-1 hover:underline lowercase italic"
                        >
                          <MapPin className="w-2.5 h-2.5" /> view map
                        </a>
                    )}
                  </div>
                  <div className="text-accent flex items-center gap-1 font-bold"><Navigation className="w-3 h-3"/> {cap.gpsCoords || 'N/A'}</div>
                  <div className="text-text-secondary truncate">{cap.address || `${cap.city}, ${cap.country}`}</div>
                  <div className="text-text-muted">Accuracy: {cap.accuracy}m</div>
                </div>

                <div className="space-y-1">
                  <div className="text-primary/50 uppercase text-[8px] mb-1 tracking-widest">Hardware Profile</div>
                  <div className="text-text-primary">{cap.os} / {cap.browser}</div>
                  <div className="text-text-secondary truncate">GPU: {cap.gpu}</div>
                  <div className="text-text-muted">Resolution: {cap.resolution}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Summarizer;