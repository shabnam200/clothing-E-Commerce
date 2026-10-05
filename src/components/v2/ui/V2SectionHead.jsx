export default function V2SectionHead({ eyebrow, title, text, action }) {
  return (
    <div className="v2-head v2-reveal">
      <div>
        <p className="v2-eyebrow">{eyebrow}</p>
        <h2 className="v2-h2">{title}</h2>
        {text && <p className="v2-lede" style={{ marginTop: 10 }}>{text}</p>}
      </div>
      {action}
    </div>
  );
}
