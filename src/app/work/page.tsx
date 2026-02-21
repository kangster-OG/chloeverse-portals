export default function WorkPage() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <iframe
        src="/work-retro/index.html"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          border: 0,
        }}
        title="Work"
        allow="fullscreen"
      />
    </div>
  );
}
