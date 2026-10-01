export function Section({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`pixel-frame space-y-3 p-3 ${className}`}>
      <h3 className="font-display text-lg tracking-wide text-gold-300">{title}</h3>
      {children}
    </section>
  );
}
