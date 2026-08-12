function prettify(filename: string): string {
  let base = filename.replace(/\.pdf$/i, "").trim();
  let prefix = "";

  if (/NCI/i.test(base)) {
    prefix = "NCI";
    base = base.replace(/\s*[-·]\s*NCI$/i, "").trim();
  } else if (/who/i.test(base)) {
    prefix = "WHO";
  } else if (/globocan|iarc|fact-sheet/i.test(base)) {
    prefix = "IARC";
  } else if (/acs|cancer-facts-and-figures|cff/i.test(base)) {
    prefix = "ACS";
  }

  return prefix ? `${prefix} · ${base}` : base;
}

export default function SourcePill({ filename }: { filename: string }) {
  return <span className="source-pill">{prettify(filename)}</span>;
}
