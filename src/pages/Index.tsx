import { useState } from "react";
import { Shield, Radio, Eye, EyeOff, Lock } from "lucide-react";

type Section = "volunteer" | "dashboard" | null;

interface PasswordGateProps {
  section: Section;
  onBack: () => void;
  onSuccess: (section: "volunteer" | "dashboard") => void;
}

const PASSWORDS: Record<string, string> = {
  volunteer: "dracarys",
  dashboard: "valar morghulis",
};

const PasswordGate = ({ section, onBack, onSuccess }: PasswordGateProps) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!section) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === PASSWORDS[section]) {
      setError("");
      onSuccess(section);
    } else {
      setError("ACCESS DENIED — Invalid credentials");
    }
  };

  return (
    <div className="animate-fade-in flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <Lock className="h-5 w-5 text-primary" />
        <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
          {section === "volunteer" ? "Volunteer" : "Dashboard"} Authentication
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Enter access code..."
            className="w-full rounded-md border border-border bg-secondary px-4 py-3 pr-10 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {error && (
          <p className="font-mono text-xs text-primary animate-fade-in">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 rounded-md border border-border bg-secondary px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 rounded-md bg-primary px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90 ops-glow-red"
          >
            Authenticate
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── Landing Page ─── */
const Landing = () => {
  const [selectedSection, setSelectedSection] = useState<Section>(null);
  const [authenticated, setAuthenticated] = useState<"volunteer" | "dashboard" | null>(null);

  if (authenticated === "volunteer") {
    return <VolunteerSection onLogout={() => setAuthenticated(null)} />;
  }

  if (authenticated === "dashboard") {
    return <DashboardSection onLogout={() => setAuthenticated(null)} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 px-4">
      {/* Scan line overlay */}
      <div className="ops-scan-line pointer-events-none fixed inset-0 z-0" />

      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            DISASTER OPS
          </h1>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Emergency Response System
        </p>
      </div>

      {!selectedSection ? (
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row animate-fade-in">
          {/* Volunteer Card */}
          <button
            onClick={() => setSelectedSection("volunteer")}
            className="group flex w-64 flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 transition-all hover:border-primary hover:ops-glow-red"
          >
            <Radio className="h-10 w-10 text-primary transition-transform group-hover:scale-110" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold">Volunteer</span>
              <span className="font-mono text-xs text-muted-foreground">
                Field reporting
              </span>
            </div>
          </button>

          {/* Dashboard Card */}
          <button
            onClick={() => setSelectedSection("dashboard")}
            className="group flex w-64 flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 transition-all hover:border-accent hover:ops-glow-amber"
          >
            <Eye className="h-10 w-10 text-accent transition-transform group-hover:scale-110" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-lg font-semibold">Dashboard</span>
              <span className="font-mono text-xs text-muted-foreground">
                Command center
              </span>
            </div>
          </button>
        </div>
      ) : (
        <div className="relative z-10">
          <PasswordGate
            section={selectedSection}
            onBack={() => setSelectedSection(null)}
            onSuccess={(s) => setAuthenticated(s)}
          />
        </div>
      )}
    </div>
  );
};

export default Landing;

/* ─── Volunteer Section ─── */
import { useEffect, useRef } from "react";
import { Upload, MapPin, LogOut, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface VolunteerSectionProps {
  onLogout: () => void;
}

const VolunteerSection = ({ onLogout }: VolunteerSectionProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoError, setGeoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Request geolocation on mount */
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setGeoError("Location access denied. You can still upload.")
    );
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setStatus(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setStatus({ type: "error", msg: "Please select an image first." });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("latitude", String(lat ?? 0));
      formData.append("longitude", String(lng ?? 0));

      const res = await fetch("http://localhost:8000/analysis", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();

      if (data.report_url) {
        const newTab = window.open(data.report_url, "_blank", "noopener,noreferrer");
        if (!newTab) {
          // Fallback if the browser blocks the popup.
          window.location.href = data.report_url;
        }
        setStatus({ type: "success", msg: "Report generated — opened in new tab." });
      } else {
        throw new Error("No report URL returned.");
      }
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message || "Network error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-primary" />
          <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Volunteer — Field Report
          </span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="w-full max-w-lg flex flex-col gap-6 animate-fade-in">
          {/* Geolocation Status */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-4 py-3">
            <MapPin className="h-4 w-4 text-success" />
            {lat && lng ? (
              <span className="font-mono text-xs text-muted-foreground">
                Location: {lat.toFixed(4)}, {lng.toFixed(4)}
              </span>
            ) : geoError ? (
              <span className="font-mono text-xs text-warning flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {geoError}
              </span>
            ) : (
              <span className="font-mono text-xs text-muted-foreground">
                Acquiring location...
              </span>
            )}
          </div>

          {/* Image Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-card p-10 transition-colors hover:border-primary"
          >
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 rounded-md object-contain"
              />
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground transition-colors group-hover:text-primary" />
                <span className="font-mono text-xs text-muted-foreground">
                  Click to upload damage image
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !file}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 font-mono text-sm uppercase tracking-wider text-primary-foreground transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 ops-glow-red"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Damage"
            )}
          </button>

          {/* Status Message */}
          {status && (
            <div
              className={`flex items-center gap-2 rounded-md border px-4 py-3 font-mono text-xs animate-fade-in ${
                status.type === "success"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              {status.msg}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

/* ─── Dashboard Section ─── */
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FileText, Navigation } from "lucide-react";
import ReportKanban, { type ReportData } from "@/components/ReportKanban";

interface DashboardSectionProps {
  onLogout: () => void;
}

interface MarkerData {
  latitude: number;
  longitude: number;
  priority: "high" | "medium" | "low";
}

interface LegacyReportData {
  report_url: string;
  image_name: string;
  timestamp: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const createIcon = (color: string) =>
  new L.Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill="${color}"/><circle cx="12" cy="12" r="5" fill="white" opacity="0.9"/></svg>`
    )}`,
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  });

const MOCK_MARKERS: MarkerData[] = [
  { latitude: 17.385, longitude: 78.4867, priority: "high" },
  { latitude: 17.44, longitude: 78.35, priority: "medium" },
  { latitude: 17.35, longitude: 78.55, priority: "low" },
  { latitude: 17.50, longitude: 78.40, priority: "high" },
  { latitude: 17.30, longitude: 78.50, priority: "medium" },
];

const MOCK_REPORTS: ReportData[] = [
  { id: "r1", report_url: "#", image_name: "flood_sector_7.jpg", timestamp: "2026-02-10 14:23:00" },
  { id: "r2", report_url: "#", image_name: "bridge_collapse_A1.jpg", timestamp: "2026-02-10 13:10:00" },
  { id: "r3", report_url: "#", image_name: "road_damage_NH65.jpg", timestamp: "2026-02-10 11:45:00" },
  { id: "r4", report_url: "#", image_name: "power_line_down_S3.jpg", timestamp: "2026-02-10 10:30:00" },
  { id: "r5", report_url: "#", image_name: "building_crack_B12.jpg", timestamp: "2026-02-10 09:15:00" },
];

const DashboardSection = ({ onLogout }: DashboardSectionProps) => {
  const [useMock, setUseMock] = useState(true);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [reportsKey, setReportsKey] = useState(0);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    if (useMock) {
      setMarkers(MOCK_MARKERS);
      setReports(MOCK_REPORTS);
      setReportsKey((k) => k + 1);
      setReportsError("");
      return;
    }

    /* Fetch markers from backend */
    fetch("http://localhost:8000/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load markers");
        return res.json();
      })
      .then((data) => setMarkers(data))
      .catch(() => setMarkers([]));

    /* Fetch reports from backend */
    setReportsLoading(true);
    fetch("http://localhost:8000/reports")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load reports");
        return res.json();
      })
      .then((data: LegacyReportData[]) => {
        const withIds = data.map((r, i) => ({ ...r, id: `api-${i}` }));
        setReports(withIds);
        setReportsKey((k) => k + 1);
      })
      .catch((err) => {
        setReportsError(err.message);
        setReports([]);
      })
      .finally(() => setReportsLoading(false));
  }, [useMock]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-accent" />
          <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Command Dashboard
          </span>
          {/* Mock Data Toggle */}
          <button
            onClick={() => setUseMock(!useMock)}
            className={`ml-4 rounded-md border px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              useMock
                ? "border-success/50 bg-success/10 text-success"
                : "border-border text-muted-foreground hover:border-foreground"
            }`}
          >
            Mock Data: {useMock ? "ON" : "OFF"}
          </button>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <LogOut className="h-3.5 w-3.5" />
          Exit
        </button>
      </header>

      <main className="flex flex-1 overflow-hidden">
        {/* Map Panel — full height, left side */}
        <div className="relative w-1/2 min-w-[300px]">
          <MapContainer
            center={[17.385, 78.4867]}
            zoom={12}
            className="h-full w-full"
            style={{ background: "hsl(220, 25%, 8%)" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {markers.map((m, i) => (
              <Marker
                key={i}
                position={[m.latitude, m.longitude]}
                icon={createIcon(PRIORITY_COLORS[m.priority] || PRIORITY_COLORS.low)}
              >
                <Popup>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 140 }}>
                    <span
                      style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 12,
                        textTransform: "uppercase",
                        color: PRIORITY_COLORS[m.priority],
                        fontWeight: 600,
                      }}
                    >
                      {m.priority} priority
                    </span>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: 11,
                        color: "#3b82f6",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      📍 Get Directions
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-[1000] flex gap-3 rounded-md border border-border bg-card/90 px-4 py-2 backdrop-blur-sm">
            {(["high", "medium", "low"] as const).map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: PRIORITY_COLORS[p] }}
                />
                <span className="font-mono text-[10px] uppercase text-muted-foreground">
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Reports Kanban — right side, 3 vertical columns */}
        <div className="flex flex-1 flex-col border-l border-border overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <FileText className="h-4 w-4 text-accent" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Reports
            </h2>
          </div>

          {reportsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : reportsError ? (
            <p className="py-4 text-center font-mono text-xs text-primary">
              {reportsError}
            </p>
          ) : reports.length === 0 ? (
            <p className="py-4 text-center font-mono text-xs text-muted-foreground">
              No reports available
            </p>
          ) : (
            <ReportKanban key={reportsKey} reports={reports} />
          )}
        </div>
      </main>
    </div>
  );
};
