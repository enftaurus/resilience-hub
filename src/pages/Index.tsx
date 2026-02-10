import { useState } from "react";
import { Shield, Radio, Eye, Lock } from "lucide-react";

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
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          placeholder="Enter access code..."
          className="w-full rounded-md border border-border bg-secondary px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          autoFocus
        />

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
        window.open(data.report_url, "_blank");
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
import { FileText } from "lucide-react";

interface DashboardSectionProps {
  onLogout: () => void;
}

interface MarkerData {
  latitude: number;
  longitude: number;
  priority: "high" | "medium" | "low";
}

interface ReportData {
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

const DashboardSection = ({ onLogout }: DashboardSectionProps) => {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [mapError, setMapError] = useState("");
  const [reportsError, setReportsError] = useState("");

  useEffect(() => {
    /* Fetch markers */
    fetch("http://localhost:8000/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load markers");
        return res.json();
      })
      .then((data) => setMarkers(data))
      .catch((err) => setMapError(err.message))
      .finally(() => setMapLoading(false));

    /* Fetch reports */
    fetch("http://localhost:8000/reports")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load reports");
        return res.json();
      })
      .then((data) => setReports(data))
      .catch((err) => setReportsError(err.message))
      .finally(() => setReportsLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5 text-accent" />
          <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
            Command Dashboard
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

      <main className="flex flex-1 flex-col lg:flex-row">
        {/* Map Panel */}
        <div className="flex-1 relative min-h-[400px]">
          {mapLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : mapError ? (
            <div className="flex h-full items-center justify-center p-6">
              <p className="font-mono text-xs text-primary">{mapError}</p>
            </div>
          ) : (
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              className="h-full w-full min-h-[400px]"
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
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

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

        {/* Reports Panel */}
        <div className="w-full border-t border-border lg:w-96 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <FileText className="h-4 w-4 text-accent" />
            <h2 className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              Reports
            </h2>
          </div>

          <div className="h-[calc(100vh-130px)] overflow-y-auto p-4">
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
              <div className="flex flex-col gap-3">
                {reports.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-md border border-border bg-card p-4 transition-colors hover:border-accent/50 animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        {r.image_name}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {r.timestamp}
                      </span>
                    </div>
                    <button
                      onClick={() => window.open(r.report_url, "_blank")}
                      className="rounded-md border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-accent transition-colors hover:border-accent hover:bg-accent/10"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
