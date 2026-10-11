import { FiCheck, FiBox, FiPackage, FiTruck, FiHome, FiX } from "react-icons/fi";

const ICONS = { pending: FiCheck, processing: FiPackage, shipped: FiTruck, delivered: FiHome, cancelled: FiX };

// Order tracking timeline. steps: [{ key, state, at }] from lib/v2/orders buildSteps();  copy: messages orderTrack.steps
// Vertical on phones, horizontal from 760px up (CSS: .v2-tl).
export default function V2OrderTimeline({ steps, copy, fmtDateTime }) {
  return (
    <ol className="v2-tl" style={{ "--n": steps.length }} aria-label={copy.timelineLabel}>
      {steps.map((s) => {
        const Icon = ICONS[s.key] || FiBox;
        return (
          <li key={s.key} data-state={s.state} aria-current={s.state === "current" ? "step" : undefined}>
            <span className="v2-tl__dot" aria-hidden="true"><Icon /></span>
            <div className="v2-tl__body">
              <h3>{copy.steps[s.key].t}</h3>
              <p>{copy.steps[s.key].d}</p>
              {s.at && s.state !== "todo" && <time dateTime={s.at}>{fmtDateTime(s.at)}</time>}
              {s.state === "current" && <em className="v2-tl__now">{copy.now}</em>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
