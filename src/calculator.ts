type Inputs = {
  bostadsPris: HTMLInputElement;
  avgift: HTMLInputElement;
  driftkostnad: HTMLInputElement;
  procentKontantInsats: HTMLInputElement;
  lanRanta: HTMLInputElement;
  bostadVardeokning: HTMLInputElement;
  borsenVardeokning: HTMLInputElement;
};

type Outputs = {
  kontantInsats: HTMLElement;
  lanBelopp: HTMLElement;
  manadRantaBrutto: HTMLElement;
  manadRanteavdrag: HTMLElement;
  manadRantaNetto: HTMLElement;
  manadAvgift: HTMLElement;
  manadDriftkostnad: HTMLElement;
  manadKapitalkostnad: HTMLElement;
  manadVardeokning: HTMLElement;
  manadTotal: HTMLElement;
  amortering: HTMLElement;
  manadUtFranKontot: HTMLElement;
};

// Swedish ränteavdrag: 30% on annual interest up to 100k SEK, 21% above.
function rantaAvdrag(arsRanta: number): number {
  const cap = 100_000;
  if (arsRanta <= cap) return arsRanta * 0.3;
  return cap * 0.3 + (arsRanta - cap) * 0.21;
}

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const formatSEK = (n: number): string =>
  new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(Math.round(n));

const num = (el: HTMLInputElement): number =>
  Number(el.value.replace(/[\s ]/g, "").replace(",", ".")) || 0;

// Insert a regular space between every group of three digits from the right.
const groupDigits = (digits: string): string =>
  digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

// Format a number-style input in place, preserving cursor position.
function formatGroupedInput(el: HTMLInputElement): void {
  const oldValue = el.value;
  const oldStart = el.selectionStart ?? oldValue.length;
  const digitsBeforeCursor = oldValue.slice(0, oldStart).replace(/\D/g, "")
    .length;

  const digits = oldValue.replace(/\D/g, "");
  const formatted = digits === "" ? "" : groupDigits(digits);
  el.value = formatted;

  let pos = 0;
  let seen = 0;
  while (pos < formatted.length && seen < digitsBeforeCursor) {
    if (/\d/.test(formatted[pos]!)) seen++;
    pos++;
  }
  el.setSelectionRange(pos, pos);
}

// Swedish amortization rules based on loan-to-value ratio.
function amorteringRate(loanToValue: number): number {
  if (loanToValue > 0.7) return 0.02;
  if (loanToValue > 0.5) return 0.01;
  return 0;
}

function update(inputs: Inputs, outputs: Outputs): void {
  const pris = num(inputs.bostadsPris);
  const avgift = num(inputs.avgift);
  const driftkostnad = num(inputs.driftkostnad);
  const dpPct = num(inputs.procentKontantInsats) / 100;
  const rantaPct = num(inputs.lanRanta) / 100;
  const bostadAppr = num(inputs.bostadVardeokning) / 100;
  const borsenAppr = num(inputs.borsenVardeokning) / 100;

  const kontantInsats = pris * dpPct;
  const lanBelopp = pris - kontantInsats;
  const ltv = pris > 0 ? lanBelopp / pris : 0;

  const arsRanta = lanBelopp * rantaPct;
  const manadRantaBrutto = arsRanta / 12;
  const manadRanteavdrag = rantaAvdrag(arsRanta) / 12;
  const manadRantaNetto = manadRantaBrutto - manadRanteavdrag;
  const manadAmortering = (lanBelopp * amorteringRate(ltv)) / 12;
  const manadKapitalkostnad = (kontantInsats * borsenAppr) / 12;
  const manadVardeokning = (pris * bostadAppr) / 12;

  const manadTotal =
    manadRantaNetto +
    avgift +
    driftkostnad +
    manadKapitalkostnad -
    manadVardeokning;

  outputs.kontantInsats.textContent = formatSEK(kontantInsats);
  outputs.lanBelopp.textContent = formatSEK(lanBelopp);
  outputs.manadRantaBrutto.textContent = formatSEK(manadRantaBrutto);
  outputs.manadRanteavdrag.textContent = formatSEK(-manadRanteavdrag);
  outputs.manadRantaNetto.textContent = formatSEK(manadRantaNetto);
  outputs.manadAvgift.textContent = formatSEK(avgift);
  outputs.manadDriftkostnad.textContent = formatSEK(driftkostnad);
  outputs.manadKapitalkostnad.textContent = formatSEK(manadKapitalkostnad);
  outputs.manadVardeokning.textContent = formatSEK(-manadVardeokning);
  const manadUtFranKontot =
    manadAmortering + avgift + driftkostnad + manadRantaNetto;

  outputs.manadTotal.textContent = formatSEK(manadTotal);
  outputs.amortering.textContent = formatSEK(manadAmortering);
  outputs.manadUtFranKontot.textContent = formatSEK(manadUtFranKontot);
}

export function calculator(): void {
  const inputs: Inputs = {
    bostadsPris: byId<HTMLInputElement>("bostads-pris"),
    avgift: byId<HTMLInputElement>("avgift"),
    driftkostnad: byId<HTMLInputElement>("driftkostnad"),
    procentKontantInsats: byId<HTMLInputElement>("procent-kontant-insats"),
    lanRanta: byId<HTMLInputElement>("lan-ranta"),
    bostadVardeokning: byId<HTMLInputElement>("bostad-vardeokning"),
    borsenVardeokning: byId<HTMLInputElement>("borsen-vardeokning"),
  };

  const outputs: Outputs = {
    kontantInsats: byId("kontant-insats"),
    lanBelopp: byId("lan-belopp"),
    manadRantaBrutto: byId("manad-ranta-brutto"),
    manadRanteavdrag: byId("manad-ranteavdrag"),
    manadRantaNetto: byId("manad-ranta-netto"),
    manadAvgift: byId("manad-avgift"),
    manadDriftkostnad: byId("manad-driftkostnad"),
    manadKapitalkostnad: byId("manad-kapitalkostnad"),
    manadVardeokning: byId("manad-vardeokning"),
    manadTotal: byId("manad-total"),
    amortering: byId("amortering"),
    manadUtFranKontot: byId("manad-ut-fran-kontot"),
  };

  const recalc = () => update(inputs, outputs);
  for (const el of Object.values(inputs)) {
    if (el.dataset.format === "sek") {
      el.addEventListener("input", () => {
        formatGroupedInput(el);
        recalc();
      });
    } else {
      el.addEventListener("input", recalc);
    }
  }
  recalc();
}
