import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { createTrackingLink } from "../utils/linkService";
import Summarizer from '../components/Summarizer'; 
import {
  Link2, Zap, Copy, Shield, Activity,
  ChevronRight, AlertCircle, Clock, Smartphone,
  Globe, CreditCard, X, Sparkles, MapPin, Search,
  MessageSquare, Send, User, Bot, Cpu, HardDrive,
  Monitor, MousePointer, Battery, Gauge, Lock
} from "lucide-react";

export default function Dashboard() {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [links, setLinks] = useState([]);
  const [label, setLabel] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [credits, setCredits] = useState(userProfile?.credits ?? 0);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showPayment, setShowPayment] = useState(false);

  const [aiSummary, setAiSummary] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // --- AI CHATBOT STATES ---
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userQuery, setUserQuery] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (showChatbot && chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chatMessages, showChatbot]);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = onSnapshot(doc(db, "users", currentUser.uid), (snap) => {
      if (snap.exists()) setCredits(snap.data().credits ?? 0);
    });
    return unsub;
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, "trackingLinks"), where("uid", "==", currentUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setLinks(data);
    });
    return unsub;
  }, [currentUser]);

  // --- NEURAL ANALYST ENGINE ---
  function processForensicData(queryStr, captures) {
    const q = queryStr.toLowerCase();
    if (!captures || captures.length === 0) return "Negative. No signal packets found for this link.";

    if (q.includes("ip") || q.includes("address") || q.includes("network")) {
      const ips = [...new Set(captures.map(c => c.ip))].filter(Boolean);
      return `Network Analysis: Identified ${ips.length} unique IP(s): ${ips.join(", ")}.`;
    }
    
    if (q.includes("where") || q.includes("location") || q.includes("city") || q.includes("country")) {
      const locs = [...new Set(captures.map(c => `${c.city || 'Unknown'}, ${c.country || 'Unknown'}`))];
      return `Geospatial Lock: Target signals originate from: ${locs.join(" | ")}.`;
    }

    if (q.includes("device") || q.includes("phone") || q.includes("hardware") || q.includes("os")) {
      const devices = [...new Set(captures.map(c => `${c.device || 'Unknown'} (${c.os || 'Unknown'})`))];
      return `Hardware Profile: Targets are utilizing ${devices.join(" and ")}.`;
    }

    if (q.includes("vpn") || q.includes("proxy") || q.includes("secure") || q.includes("risk")) {
      const suspicious = captures.filter(c => c.isProxy === "true" || c.isTor === "true" || c.isVpn === "true").length;
      return `Risk Report: ${suspicious} out of ${captures.length} signals show active anonymization (VPN/Proxy/Tor).`;
    }

    if (q.includes("click") || q.includes("time") || q.includes("when")) {
        return `Activity Log: Total of ${captures.length} intercepts recorded. Last signal received recently.`;
    }

    return "Forensic System Online. Ask about IPs, locations, hardware profiles, or security risks for this specific link.";
  }

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!userQuery.trim() || !selectedLink) return;

    const userMsg = { role: "user", text: userQuery };
    setChatMessages(prev => [...prev, userMsg]);
    
    const botResponse = processForensicData(userQuery, selectedLink.captures || []);
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: "bot", text: botResponse }]);
    }, 400);
    setUserQuery("");
  };

  async function handleAISummary(link) {
    setIsAnalyzing(true);
    try {
      if (!link.captures || link.captures.length === 0) {
        setAiSummary("No signal data available for analysis.");
        return;
      }

      const report = link.captures.map((cap, i) => {
        const loc = cap.gpsAddress || cap.address || cap.city || "Undisclosed Sector";
        const precision = cap.gpsAccuracy || cap.accuracy || 'unknown';
        const provider = cap.isp || 'an encrypted gateway';
        const platform = `${cap.os} (${cap.browser})`;
        const hardwareDetail = cap.gpu ? `Visual processing driven by ${cap.gpu}.` : "Standard hardware acceleration detected.";
        const connectionType = cap.asn ? `Routing established through ASN: ${cap.asn}.` : "Standard protocol established.";
        const resolutionInfo = cap.resolution ? `Display architecture verified at ${cap.resolution}.` : "Display metrics redacted.";

        return `[SIGNAL RECON #${i + 1}]: Intercept recorded on a ${cap.device} running ${platform}. Network access via ${provider}. ${connectionType} ${hardwareDetail} ${resolutionInfo} Location: ${loc} (${precision}m precision).`;
      }).join('\n\n');

      setAiSummary(report);
    } catch (err) {
      setAiSummary("Neural Analysis failed to synthesize signal data.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleGenerate(e) {
    e.preventDefault();
    if (credits < 1) { setShowPayment(true); return; }
    if (!destinationUrl) { setError("Destination URL is required"); return; }
    setGenerating(true);
    setError("");
    setSuccess("");
    try {
      const { trackingUrl } = await createTrackingLink(currentUser.uid, label || "Tracking Link", destinationUrl);
      setSuccess(trackingUrl);
      setLabel("");
      setDestinationUrl("");
      await fetchUserProfile(currentUser.uid);
    } catch (err) {
      setError(err.message);
    }
    setGenerating(false);
  }

  const copyToClipboard = (text) => navigator.clipboard.writeText(text);

  return (
    <div className="min-h-screen bg-surface pt-16 text-text-primary font-body">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl tracking-wider uppercase">COMMAND <span className="text-primary">CENTER</span></h1>
            <p className="text-sm text-text-secondary mt-1 uppercase tracking-widest">
              ID: <span className="text-primary">{userProfile?.displayName || "OFFICER"}</span>
              {userProfile?.badgeId && <span className="text-text-muted ml-2">#UNIT-{userProfile.badgeId}</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-surface-card border border-surface-border rounded-xl px-5 py-3 flex items-center gap-3 shadow-glow-sm">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <div className="font-mono text-2xl text-primary leading-none">{credits}</div>
                <div className="text-[10px] text-text-muted uppercase font-bold tracking-tighter">Credits</div>
              </div>
            </div>
            <button onClick={() => setShowPayment(true)} className="px-4 py-3 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm hover:bg-primary/20 transition-all flex items-center gap-2 font-bold uppercase tracking-widest">
              <CreditCard className="w-4 h-4" /> Recharge
            </button>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Links", value: links.length, icon: <Link2 className="w-4 h-4" /> },
            { label: "Intercepts", value: links.reduce((a, l) => a + (l.captures?.length || 0), 0), icon: <Smartphone className="w-4 h-4" /> },
            { label: "Active Nodes", value: links.filter((l) => l.active).length, icon: <Activity className="w-4 h-4" /> },
            { label: "Global Clicks", value: links.reduce((a, l) => a + (l.clicks || 0), 0), icon: <Globe className="w-4 h-4" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface-card border border-surface-border rounded-xl p-4 shadow-sm hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 text-text-muted mb-2">
                {stat.icon}
                <span className="text-[10px] uppercase tracking-widest font-bold">{stat.label}</span>
              </div>
              <div className="font-display text-3xl text-text-primary">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-[#111827] border border-slate-800 rounded-3xl p-8 sticky top-24 shadow-2xl">
              <h2 className="font-display text-2xl tracking-wider mb-2 uppercase text-white font-bold">
                GENERATE <span className="text-cyan-400">LINK</span>
              </h2>
              <p className="text-xs text-slate-500 mb-8 leading-relaxed">
                Creates a disguised interface that captures advanced device metadata and forensics.
              </p>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-3 py-2.5 text-sm mb-4">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />{error}
                </div>
              )}

              {success && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 mb-6 border-l-4 border-l-cyan-400">
                  <p className="text-[10px] text-cyan-400 mb-2 font-black uppercase tracking-widest">Intercept Live:</p>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-300 truncate flex-1">{success}</span>
                    <button onClick={() => copyToClipboard(success)} className="text-cyan-400 hover:scale-110 transition-transform">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleGenerate} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                    DESTINATION URL (REQUIRED)
                  </label>
                  <input 
                    type="url" 
                    value={destinationUrl} 
                    onChange={(e) => setDestinationUrl(e.target.value)} 
                    placeholder="https://example.com" 
                    required 
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-300 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider ml-1">
                    CASE / LABEL (OPTIONAL)
                  </label>
                  <input 
                    type="text" 
                    value={label} 
                    onChange={(e) => setLabel(e.target.value)} 
                    placeholder="e.g., Case #2024-078" 
                    className="w-full bg-[#0a0f1d] border border-slate-800 rounded-xl px-5 py-4 text-sm text-slate-300 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-700" 
                  />
                </div>

                {credits < 1 ? (
                  <button 
                    type="button"
                    onClick={() => setShowPayment(true)}
                    className="w-full py-4 bg-cyan-400 text-black font-bold text-base rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all uppercase"
                  >
                    <Link2 className="w-5 h-5 rotate-[-45deg]" /> No Credits – Buy Now
                  </button>
                ) : (
                  <button 
                    type="submit" 
                    disabled={generating} 
                    className="w-full py-4 bg-cyan-400 text-black font-bold text-base rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:brightness-110 transition-all uppercase"
                  >
                    {generating ? "Deploying..." : "Deploy Asset"}
                  </button>
                )}
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 min-h-[500px]">
              <h2 className="font-display text-xl tracking-wider mb-6 flex items-center gap-2 uppercase">
                <Search className="w-5 h-5 text-primary" /> ACTIVE <span className="text-primary">INVESTIGATIONS</span>
              </h2>
              {links.length === 0 ? (
                <div className="text-center py-24">
                  <Shield className="w-16 h-16 text-text-muted/10 mx-auto mb-4" />
                  <p className="text-text-muted text-xs uppercase tracking-widest font-bold">No signal logs detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.map((link) => (
                    <div key={link.id} className={`bg-surface border rounded-xl p-4 transition-all ${selectedLink?.id === link.id ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-surface-border hover:border-primary/40"}`}>
                      <div 
                        className="flex justify-between items-start cursor-pointer" 
                        onClick={() => {
                          setSelectedLink(selectedLink?.id === link.id ? null : link);
                          setAiSummary("");
                          setShowChatbot(false);
                          setChatMessages([{ role: "bot", text: "Forensic Neural System Online. Ready to analyze captured signals for this asset." }]);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-lg text-text-primary block truncate uppercase tracking-tight">{link.label}</span>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono uppercase">
                                <Clock className="w-3 h-3 text-primary" /> 
                                {link.createdAt ? new Date(link.createdAt.toMillis()).toLocaleDateString() : 'Pending'}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono uppercase">
                                <Smartphone className="w-3 h-3 text-primary" /> 
                                {link.captures?.length || 0} Logs
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(link.trackingUrl); }} className="p-2 text-text-muted hover:text-primary transition-colors bg-surface-card rounded-lg border border-surface-border">
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${selectedLink?.id === link.id ? "rotate-90 text-primary" : "text-text-muted"}`} />
                        </div>
                      </div>

                      {selectedLink?.id === link.id && (
                        <div className="mt-5 space-y-6 animate-in fade-in slide-in-from-top-2">
                          <div className="p-5 bg-slate-900/80 rounded-xl border-l-4 border-primary shadow-xl">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                              <h4 className="text-[10px] text-primary uppercase font-black tracking-[0.2em] flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Neural Analysis
                              </h4>
                              <div className="flex gap-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowChatbot(!showChatbot); }}
                                  className={`text-[9px] px-3 py-1 rounded border font-black uppercase flex items-center gap-1.5 transition-all ${showChatbot ? 'bg-primary text-surface border-primary' : 'bg-primary/10 text-primary border-primary/30'}`}
                                >
                                  <MessageSquare className="w-3 h-3" /> {showChatbot ? "Terminal" : "AI Chat"}
                                </button>
                                {!aiSummary && !showChatbot && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleAISummary(link); }}
                                    disabled={isAnalyzing}
                                    className="text-[9px] bg-primary text-surface px-3 py-1 rounded font-black uppercase hover:brightness-110 disabled:opacity-50"
                                  >
                                    {isAnalyzing ? "Processing..." : "Run Diagnostics"}
                                  </button>
                                )}
                              </div>
                            </div>

                            {showChatbot ? (
                              <div className="mt-4 bg-black/40 rounded-lg overflow-hidden border border-white/5" onClick={(e) => e.stopPropagation()}>
                                <div className="h-40 overflow-y-auto p-4 space-y-3 font-mono text-[11px]">
                                  {chatMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-surface text-text-secondary border border-white/10'}`}>
                                        <div className="flex items-center gap-1.5 mb-1 opacity-50 uppercase text-[8px] font-black">
                                          {msg.role === 'user' ? <User className="w-2 h-2" /> : <Bot className="w-2 h-2" />} {msg.role}
                                        </div>
                                        {msg.text}
                                      </div>
                                    </div>
                                  ))}
                                  <div ref={chatEndRef} />
                                </div>
                                <form onSubmit={handleChatSubmit} className="p-2 border-t border-white/5 flex gap-2">
                                  <input 
                                    type="text" 
                                    value={userQuery} 
                                    onChange={(e) => setUserQuery(e.target.value)}
                                    placeholder="Query IPs, devices, or locations..."
                                    className="flex-1 bg-surface border border-white/10 rounded-md px-3 py-2 text-[11px] outline-none text-text-primary"
                                  />
                                  <button type="submit" className="bg-primary p-2 rounded-md text-surface"><Send className="w-3 h-3" /></button>
                                </form>
                              </div>
                            ) : (
                              <>
                                {aiSummary ? (
                                  <p className="text-gray-200 text-sm leading-relaxed italic font-medium whitespace-pre-wrap">"{aiSummary}"</p>
                                ) : (
                                  <p className="text-text-muted text-[11px] uppercase tracking-wider">Awaiting signal synthesis or chat query...</p>
                                )}
                              </>
                            )}
                          </div>

                          <Summarizer captures={link.captures || []} />
                          
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black tracking-[0.3em] text-text-muted uppercase flex items-center gap-2 border-b border-surface-border pb-2">
                              <Activity className="w-3.5 h-3.5" /> Signal Intercept History
                            </h4>
                            {link.captures?.length > 0 ? (
                              link.captures.map((c, i) => <CaptureCard key={i} capture={c} index={i} />)
                            ) : (
                              <p className="text-xs text-text-muted py-8 italic text-center uppercase tracking-widest">Awaiting subject interaction...</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} uid={currentUser?.uid} fetchUserProfile={fetchUserProfile} />}
    </div>
  );
}

function CaptureCard({ capture, index }) {
  const hasGPS = capture.gpsLat && capture.gpsLon;
  const mapUrl = hasGPS 
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${capture.gpsLon - 0.005},${capture.gpsLat - 0.005},${capture.gpsLon + 0.005},${capture.gpsLat + 0.005}&layer=mapnik&marker=${capture.gpsLat},${capture.gpsLon}`
    : null;

  return (
    <div className="bg-surface-elevated border border-surface-border rounded-xl p-5 shadow-inner hover:border-primary/20 transition-all space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasGPS ? 'bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-primary'}`}></div>
          <div className="font-mono text-[10px] text-text-muted uppercase tracking-widest">
            Intercept #{index + 1} • {capture.timestamp || 'LOG_FILE'}
          </div>
        </div>
        <div className={`text-[9px] px-2.5 py-1 rounded-lg font-black border tracking-widest uppercase ${hasGPS ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"}`}>
          {hasGPS ? "GPS LOCK" : "IP TRACE"}
        </div>
      </div>

      {/* Forensic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Network & Infrastructure */}
        <DataSection title="Network & Infrastructure" icon={<Globe className="w-3 h-3" />}>
          <DataRow label="Public IP Address" value={capture.ip} />
          <DataRow label="ISP / Provider" value={capture.isp} />
          <DataRow label="ASN" value={capture.asn} />
          <DataRow label="Connection Type" value={capture.connectionType} />
        </DataSection>

        {/* Hardware Deep-Dive */}
        <DataSection title="Hardware & System" icon={<Cpu className="w-3 h-3" />}>
          <DataRow label="Device Type" value={capture.device} />
          <DataRow label="CPU Cores" value={capture.cpuCores} />
          <DataRow label="RAM (EST)" value={capture.ram} />
          <DataRow label="Architecture" value={capture.architecture} />
          <DataRow label="Max Touch Points" value={capture.maxTouch} />
        </DataSection>

        {/* Graphics & WebGL */}
        <DataSection title="Graphics & WebGL" icon={<HardDrive className="w-3 h-3" />}>
          <DataRow label="GPU Vendor" value={capture.gpuVendor} />
          <DataRow label="GPU Renderer" value={capture.gpu} />
          <DataRow label="WebGL Version" value={capture.webglVersion} />
        </DataSection>

        {/* Display & Visual Metrics */}
        <DataSection title="Display Metrics" icon={<Monitor className="w-3 h-3" />}>
          <DataRow label="Resolution" value={capture.resolution} />
          <DataRow label="Color Depth" value={capture.colorDepth} />
          <DataRow label="Pixel Ratio" value={capture.pixelRatio} />
        </DataSection>

        {/* Browser & Environment */}
        <DataSection title="Environment" icon={<MousePointer className="w-3 h-3" />}>
          <DataRow label="Browser & OS" value={`${capture.browser} on ${capture.os}`} />
          <DataRow label="Timezone" value={capture.timezone} />
          <DataRow label="Locale" value={capture.locale} />
        </DataSection>

        {/* Power & Environmental */}
        <DataSection title="Power & Env" icon={<Battery className="w-3 h-3" />}>
          <DataRow label="Battery Level" value={capture.batteryLevel} />
          <DataRow label="Charging Status" value={capture.isCharging} />
        </DataSection>

        {/* Performance Markers */}
        <DataSection title="Performance" icon={<Gauge className="w-3 h-3" />}>
          <DataRow label="DNS Lookup" value={capture.dnsLookup} />
          <DataRow label="TCP Connect" value={capture.tcpConnect} />
          <DataRow label="Server Response" value={capture.serverResponse} />
          <DataRow label="Page Load" value={capture.pageLoad} />
        </DataSection>

        {/* Security & Fingerprint */}
        <DataSection title="Security & Fingerprint" icon={<Lock className="w-3 h-3" />}>
          <DataRow label="User Agent" value={capture.userAgent} />
          <DataRow label="Canvas Hash" value={capture.canvasFingerprint} />
          <DataRow label="Audio Hash" value={capture.audioFingerprint} />
          <DataRow label="Is VPN/Proxy" value={capture.isVpn} />
        </DataSection>
      </div>

      {/* GPS / Map Section */}
      {hasGPS && (
        <div className="pt-6 border-t border-surface-border">
          <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase mb-3 tracking-widest">
            <MapPin className="w-3 h-3" /> Satellite Telemetry
          </div>
          <p className="text-xs text-text-primary mb-4 bg-surface/50 p-3 rounded border border-surface-border font-mono leading-relaxed">
            {capture.gpsAddress || capture.address || "Resolving coordinate address..."}
          </p>
          
          <div className="rounded-xl overflow-hidden border border-surface-border mb-4 bg-slate-900" style={{ height: 220 }}>
            <iframe 
              title={"map-" + index} 
              width="100%" 
              height="100%" 
              frameBorder="0"
              src={mapUrl}
              allowFullScreen 
            />
          </div>
          
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${capture.gpsLat},${capture.gpsLon}`}
            target="_blank" 
            rel="noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-500 transition-all shadow-glow-sm"
          >
            <MapPin className="w-3 h-3" /> Open in External Map
          </a>
        </div>
      )}
    </div>
  );
}

function DataSection({ title, icon, children }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[9px] text-primary uppercase font-black tracking-[0.2em] flex items-center gap-2 border-b border-primary/10 pb-1">
        {icon} {title}
      </div>
      <div className="grid gap-3">
        {children}
      </div>
    </div>
  );
}

function DataRow({ label, value }) {
  // If value is null, undefined, or empty string, show "Redacted" or "N/A"
  const displayValue = (value === null || value === undefined || value === "") ? "N/A" : String(value);
  
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider mb-0.5">{label}</span>
      <span className="text-[11px] text-text-primary font-mono break-all leading-tight">
        {displayValue}
      </span>
    </div>
  );
}

function PaymentModal({ onClose, uid, fetchUserProfile }) {
  const plans = [
    { credits: 10, price: 99, label: "Starter Pack" },
    { credits: 30, price: 249, label: "Investigator", popular: true },
    { credits: 100, price: 699, label: "Agency" }
  ];
  const [processing, setProcessing] = useState(false);

  async function handlePurchase() {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-elevated border border-surface-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-xl tracking-wider uppercase">OPS <span className="text-primary">RESOURCES</span></h2>
          <button onClick={onClose} className="p-1 hover:bg-surface rounded-full transition-colors text-text-muted"><X /></button>
        </div>
        <div className="space-y-3">
          {plans.map((p, i) => (
            <div key={i} className={`p-4 border rounded-xl flex justify-between items-center cursor-pointer transition-all ${p.popular ? 'border-primary bg-primary/5' : 'border-surface-border bg-surface hover:border-primary/40'}`}>
              <div>
                <div className="font-bold text-lg uppercase tracking-tight">{p.label}</div>
                <div className="text-xs text-text-muted">{p.credits} Operation Credits</div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold text-xl">₹{p.price}</div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={handlePurchase} disabled={processing} className="w-full mt-6 py-4 bg-primary text-surface rounded-xl font-black text-xs tracking-[0.2em] uppercase hover:brightness-110 active:scale-95 transition-all shadow-glow">
          {processing ? "Connecting to Gateway..." : "Initialize Secure Checkout"}
        </button>
      </div>
    </div>
  );
}