// Shared empty / no-results panel (shop "No products found", empty cart, empty wishlist).
export default function V2EmptyState({ icon, title, text, children }) {
  return (
    <div className="v2-empty" role="status">
      {icon && <span className="v2-empty__icon" aria-hidden="true">{icon}</span>}
      <h2 className="v2-display v2-empty__title">{title}</h2>
      {text && <p className="v2-lede v2-empty__text">{text}</p>}
      {children && <div className="v2-empty__actions">{children}</div>}
    </div>
  );
}
