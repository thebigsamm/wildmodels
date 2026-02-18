export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 36, marginBottom: 8 }}>WildModels</h1>
      <p style={{ fontSize: 16, maxWidth: 600 }}>
        Nigeria-first hookup & dating discovery. Browse profiles as a guest.
      </p>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <a href="/browse">Browse Profiles</a>
        <a href="/create-profile">Create Profile</a>
      </div>

      <p style={{ marginTop: 24, color: "#666", maxWidth: 700 }}>
        Safety note: 18+ only. Report & block features will be built into the MVP.
      </p>
    </main>
  );
}
