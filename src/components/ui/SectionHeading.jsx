// Zip ".section-title": small blue label + bold h2 with yellow highlight.
export default function SectionHeading({ eyebrow, title, highlight }) {
  return (
    <div className="mb-12 text-center">
      <p className="mb-1 text-lg font-bold text-brand">{eyebrow}</p>
      <h2 className="mt-2 text-4xl font-bold">{title} <span className="text-accent">{highlight}</span></h2>
    </div>
  );
}
