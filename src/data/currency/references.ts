export type CurrencyReference = {
  id: string;
  currency: 'PHP';
  denomination: 20 | 50 | 100 | 200 | 500 | 1000;
  material: 'paper' | 'polymer';
  series: string;
  officialSource: string;
  sourceLabel: string;
  lastVerified: string;
  status: 'official-source-checked-images-not-cached';
  frontImage: null;
  backImage: null;
  featureNotes: null;
};

const ngcSource = 'https://www.bsp.gov.ph/SitePages/CoinsAndNotes/NewGenerationCurrencyBanknotes.aspx';
const polymerSource = 'https://www.bsp.gov.ph/SitePages/CoinsAndNotes/PolymerBanknote.aspx';
const verifiedDate = '2026-11-14';

function paper(denomination: CurrencyReference['denomination']): CurrencyReference {
  return { id: `php-${denomination}-ngc-paper`, currency: 'PHP', denomination, material: 'paper', series: 'New Generation Currency', officialSource: ngcSource, sourceLabel: 'BSP New Generation Currency banknotes', lastVerified: verifiedDate, status: 'official-source-checked-images-not-cached', frontImage: null, backImage: null, featureNotes: null };
}
function polymer(denomination: 50 | 100 | 500 | 1000): CurrencyReference {
  return { id: `php-${denomination}-first-polymer`, currency: 'PHP', denomination, material: 'polymer', series: 'First Philippine Polymer Banknote Series', officialSource: polymerSource, sourceLabel: 'BSP Polymer Banknotes', lastVerified: verifiedDate, status: 'official-source-checked-images-not-cached', frontImage: null, backImage: null, featureNotes: null };
}

/** Series/denomination availability verified against official BSP reference pages. */
export const currencyReferences: readonly CurrencyReference[] = [
  paper(20), paper(50), paper(100), paper(200), paper(500), paper(1000),
  polymer(50), polymer(100), polymer(500), polymer(1000),
];
