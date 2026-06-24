export function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 bg-[#f7f7f8]" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(circle at 50% 18%, rgba(0, 0, 0, 0.11) 0%, rgba(0, 0, 0, 0.055) 28%, transparent 58%)",
            "linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(247, 247, 248, 0.92) 52%, rgba(241, 241, 242, 0.96) 100%)",
          ].join(", "),
          opacity: 1,
          mixBlendMode: "multiply",
        }}
      />
    </div>
  )
}
