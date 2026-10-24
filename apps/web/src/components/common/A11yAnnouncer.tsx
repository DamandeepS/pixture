import { useProject } from '../../state/ProjectContext.js';

export function A11yAnnouncer() {
  const { announcement } = useProject();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}
