import type { PropertyRow } from "@pls/types";
import { formatLastTouch, formatUnits } from "../lib/format";

type Props = {
  rows: PropertyRow[];
  params: Record<string, string | undefined>;
  selected?: string;
};

function href(params: Record<string, string | undefined>, changes: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...changes })) if (v) next.set(k, v);
  return `/?${next.toString()}`;
}

function SortHeader({ label, field, params }: { label: string; field: string; params: Props["params"] }) {
  const active = params.sort === field;
  const dir = active && params.dir === "asc" ? "desc" : "asc";
  const arrow = active ? (params.dir === "asc" ? " ▲" : " ▼") : "";
  return (
    <th>
      <a href={href(params, { sort: field, dir, selected: undefined })}>
        {label}
        {arrow}
      </a>
    </th>
  );
}

export function PropertiesTable({ rows, params, selected }: Props) {
  if (rows.length === 0) return <p className="muted">No properties match your search.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>APN</th>
          <th>Address</th>
          <th>Owner</th>
          <th>Units</th>
          <SortHeader label="Tier" field="tier" params={params} />
          <SortHeader label="Last touch" field="last_touch" params={params} />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const link = href(params, { selected: r.id });
          return (
            <tr key={r.id} className={r.id === selected ? "selected" : undefined}>
              <td><a href={link}>{r.apn}</a></td>
              <td><a href={link}>{r.address}, {r.city}</a></td>
              <td><a href={link}>{r.ownerName ?? "—"}</a></td>
              <td><a href={link}>{formatUnits(r.units, r.unitsVerified)}</a></td>
              <td><a href={link}>{r.tier ?? "—"}</a></td>
              <td><a href={link}>{formatLastTouch(r.lastTouchAt)}</a></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
