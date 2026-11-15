import { useState } from 'react';
import { Banknote, ChevronRight, ScanLine } from 'lucide-react';
import { t as translate, type Language, type TranslationKey } from '../i18n';
import type { CurrencyReference } from '../data/currency/references';

type SpecimenDenomination = 50 | 100 | 500 | 1000;
type Side = 'front' | 'back';

const specimenDenominations: readonly SpecimenDenomination[] = [50, 100, 500, 1000];
const specimenImage = (denomination: SpecimenDenomination, side: Side) =>
  `/currency-samples/php-${denomination}-polymer-${side}.jpg`;

const slides = specimenDenominations.flatMap(denomination =>
  (['front', 'back'] as const).map(side => ({
    id: `${denomination}-${side}`,
    denomination,
    side,
    isSpecimen: true,
    image: specimenImage(denomination, side),
  })),
);

export function BanknoteSampleDemo({ language = 'English' }: { language?: Language }) {
  const [active, setActive] = useState(0);
  const slide = slides[active];
  const text = (key: TranslationKey) => translate(key, language);
  const move = (amount: number) => setActive(index => (index + amount + slides.length) % slides.length);

  return (
    <section className="banknote-demo panel glass" aria-label={text('sampleDemo')} aria-roledescription="carousel">
      <div className="demo-heading">
        <span className="demo-mode"><i /> {text('sampleDemo')}</span>
        <p>{text('sampleOnly')}</p>
      </div>
      <div className="demo-stage" aria-live="polite">
        <img key={slide.image} src={slide.image} alt={`${text('sampleDemo')} - ${slide.denomination} PHP - ${slide.side}`} loading="lazy" />
        <span className="demo-watermark" aria-hidden="true">{slide.isSpecimen ? 'SPECIMEN' : 'SAMPLE'}</span>
        <div className="demo-frame" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="demo-points" aria-hidden="true"><i /><i /><i /><i /></div>
        <button className="demo-arrow demo-previous" onClick={() => move(-1)} aria-label={text('previousSample')}><ChevronRight size={17} /></button>
        <button className="demo-arrow demo-next" onClick={() => move(1)} aria-label={text('nextSample')}><ChevronRight size={17} /></button>
        <div className="demo-dots" aria-label={text('chooseSample')}>
          {slides.map((item, index) => <button key={item.id} className={index === active ? 'active' : ''} aria-label={`${text('chooseSample')} - ${item.denomination} PHP - ${item.side}`} aria-current={index === active ? 'true' : undefined} onClick={() => setActive(index)} />)}
        </div>
      </div>
      <div className="demo-caption">
        <div className="demo-caption-icon"><ScanLine size={16} /></div>
        <div className="demo-caption-text"><strong>₱{slide.denomination.toLocaleString('en-PH')} {text('banknoteSample')}</strong><small>{slide.isSpecimen ? `SPECIMEN reference - ${slide.side}` : text('referencePhoto')}</small></div>
        <span className="demo-count">{active + 1} / {slides.length}</span>
      </div>
      {slide.isSpecimen
        ? <p className="demo-credit">User-provided SPECIMEN reference image. Demo and learning use only; it does not assess authenticity.</p>
        : <p className="demo-credit">{text('photoCredit')} <a href="https://universe.roboflow.com/philippine-banknotes/philippine-banknotes/dataset/8" target="_blank" rel="noreferrer">Roboflow Philippine Banknotes v8</a> · CC BY 4.0. {text('sampleCaveat')}</p>}
    </section>
  );
}

export function CurrencyReferenceArt({ reference }: { reference: CurrencyReference }) {
  const [side, setSide] = useState<Side>('front');
  const hasSpecimen = reference.material === 'polymer' && specimenDenominations.includes(reference.denomination as SpecimenDenomination);
  const image = hasSpecimen ? specimenImage(reference.denomination as SpecimenDenomination, side) : null;

  return (
    <div className="library-art">
      {image
        ? <img src={image} alt={`${reference.denomination} peso polymer SPECIMEN ${side} reference image`} loading="lazy" />
        : <div className="library-no-specimen"><Banknote size={25} aria-hidden="true"/><span>Paper note photo not provided</span></div>}
      {image && <span className="library-sample-label">SPECIMEN · POLYMER DEMO ONLY</span>}
      {hasSpecimen && <button className="library-side-toggle" onClick={() => setSide(current => current === 'front' ? 'back' : 'front')} aria-label={`Show ${side === 'front' ? 'back' : 'front'} of ₱${reference.denomination} polymer specimen`}>
        {side === 'front' ? 'Front' : 'Back'} · flip
      </button>}
    </div>
  );
}
