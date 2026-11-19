import { isTodo, type Todo } from "@/content/work";

/**
 * One row of the facts list. A `todo()` value is a dashed amber marker
 * in development and disappears entirely from production builds, so a
 * placeholder can be seen while writing and can never ship.
 */
export default function Fact({ label, value }: { label: string; value: string | Todo }) {
  if (isTodo(value)) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <div className="flex items-baseline justify-between gap-6 py-2">
        <dt className="text-neutral-500">{label}</dt>
        <dd>
          <span className="todo">TODO: {value.todo.toLowerCase()}</span>
        </dd>
      </div>
    );
  }
  return (
    <div className="flex items-baseline justify-between gap-6 py-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right text-neutral-900">{value}</dd>
    </div>
  );
}
