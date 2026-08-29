/**
 * Placeholder. Homepage sebenarnya adalah port konsep 06 Arus — sembilan
 * seksi, lihat MILESTONE.md M4. Belum dikerjakan: menunggu komponen
 * ./reactbits dan ./lightswind ditambahkan pemilik proyek (M1).
 */
export default function Home() {
  return (
    <main
      style={{
        maxWidth: "var(--max)",
        margin: "0 auto",
        padding: "clamp(72px, 11vw, 144px) var(--margin)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          fontWeight: 500,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--ink-300)",
        }}
      >
        Scaffolding · M0
      </p>

      <h1
        style={{
          marginTop: "1rem",
          fontSize: "clamp(2rem, 6vw, 4rem)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 0.98,
        }}
      >
        Jangkar Coffee Industry
      </h1>

      <p
        style={{
          marginTop: "1.25rem",
          maxWidth: "54ch",
          fontWeight: 400,
          color: "var(--ink-200)",
          lineHeight: 1.65,
        }}
      >
        Monorepo siap. Desain konsep <strong style={{ fontWeight: 600 }}>06 Arus</strong> dengan
        palet <strong style={{ fontWeight: 600 }}>Cap Jangkar 999</strong> belum diport — lihat{" "}
        <code style={{ fontFamily: "var(--font-mono)", color: "var(--red-lift)" }}>
          MILESTONE.md
        </code>
        .
      </p>
    </main>
  );
}
