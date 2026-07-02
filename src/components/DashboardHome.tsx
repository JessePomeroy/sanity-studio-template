import { useEffect, useState } from "react";
import { useClient } from "sanity";
import { clientConfig } from "../../client.config";

interface Stats {
  galleries: number;
  totalImages: number;
  products: number;
  printProducts: number;
}

const STATS_QUERY = `{
  "galleries": count(*[_type == "gallery"]),
  "totalImages": count(*[_type == "gallery"].images[]),
  "products": count(*[_type == "product" && inStock == true]),
  "printProducts": count(*[_type == "lumaProductV2" && inStock == true])
}`;

export function DashboardHome() {
  const client = useClient({ apiVersion: "2024-01-01" });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client
      .fetch(STATS_QUERY)
      .then((result) => {
        setStats(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard stats");
        setLoading(false);
      });
  }, [client]);

  if (error) {
    return (
      <div style={styles.container}>
        <p style={styles.error}>Something went wrong: {error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loading}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>{clientConfig.dashboardHeading}</h1>
      <p style={styles.subtitle}>{clientConfig.dashboardSubtitle}</p>

      {/* Stats Cards */}
      <div style={styles.grid}>
        <StatCard label="Galleries" value={stats?.galleries ?? 0} />
        <StatCard label="Total Images" value={stats?.totalImages ?? 0} />
        <StatCard label="Print Products" value={stats?.printProducts ?? 0} suffix="in stock" />
        <StatCard label="Other Products" value={stats?.products ?? 0} suffix="in stock" />
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actions}>
          <a
            href={clientConfig.liveSiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.actionLink}
          >
            View Live Site
          </a>
          <a
            href={clientConfig.adminDashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.actionLink}
          >
            Admin Dashboard
          </a>
        </div>
        <p style={{ ...styles.empty, marginTop: "1rem" }}>
          Orders and inquiries are managed in the Admin Dashboard.
        </p>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardValue}>
        {value}
        {suffix && <span style={styles.cardSuffix}> {suffix}</span>}
      </div>
      <div style={styles.cardLabel}>{label}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: "2rem",
    maxWidth: "960px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: "#e0e0e0",
  },
  heading: {
    fontSize: "1.75rem",
    fontWeight: 600,
    margin: "0 0 0.25rem",
    color: "#fff",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#999",
    margin: "0 0 2rem",
  },
  loading: {
    color: "#999",
    fontSize: "0.95rem",
  },
  error: {
    color: "#ef4444",
    fontSize: "0.95rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: "1rem",
    marginBottom: "2.5rem",
  },
  card: {
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "1.25rem 1rem",
  },
  cardValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#fff",
  },
  cardSuffix: {
    fontSize: "0.8rem",
    fontWeight: 400,
    color: "#999",
  },
  cardLabel: {
    fontSize: "0.8rem",
    color: "#999",
    marginTop: "0.25rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  section: {
    marginBottom: "2.5rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#fff",
    marginBottom: "1rem",
  },
  empty: {
    color: "#666",
    fontSize: "0.9rem",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap" as const,
  },
  actionLink: {
    display: "inline-block",
    padding: "0.5rem 1rem",
    background: "#2a2a2a",
    border: "1px solid #444",
    borderRadius: "6px",
    color: "#e0e0e0",
    textDecoration: "none",
    fontSize: "0.875rem",
    cursor: "pointer",
  },
};
