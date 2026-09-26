"use client";
import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronUp, X, Pin, Focus, Layers, Tag, ScanSearch, LocateFixed, Link2, GitMerge, Search, Orbit } from 'lucide-react';
import { clusterColor } from './embeddingPalette.mjs';
import styles from './exploration.module.css';

export default function ExplorationTray({ info, focus, onFocus, pins, onPin, onUnpin, shared, onSelect, onClear, onFrame, showLabels, onLabels, motion, onMotion, clusters, spotlight, onSpotlight, onFrameCluster, minimalist }) {
  const t = useTranslations('Exploration');
  const [expanded, setExpanded] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [clusterQuery, setClusterQuery] = useState('');
  const [shownWords, setShownWords] = useState(80);
  const touchY = useRef(null);
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!minimalist) return;
    let timer;
    const wake = () => { setIdle(false); clearTimeout(timer); timer = setTimeout(() => setIdle(true), 3000); };
    wake();
    window.addEventListener('pointermove', wake);
    return () => { clearTimeout(timer); window.removeEventListener('pointermove', wake); setIdle(false); };
  }, [minimalist]);
  const found = info?.state === 'found';
  const anchored = found && pins[0] === info.word;
  const direct = pins.length === 2 && found && info.links.includes(pins[0]);
  const cluster = clusters.find((item) => item.id === spotlight);
  const label = spotlight === -1 ? t('unassigned') : t('cluster', { id: spotlight });
  const matchingWords = cluster?.words.filter((word) => word.toLowerCase().includes(clusterQuery.trim().toLowerCase())) ?? [];
  const chooseCluster = (id) => {
    setClusterQuery('');
    setShownWords(80);
    onSpotlight(spotlight === id ? null : id);
    if (spotlight !== id) setShowClusters(false);
  };
  return (
    <>
      <div className={`${styles.tools} ${minimalist ? styles.fullTools : ''} ${idle && !showClusters ? styles.idle : ''}`} aria-label={t('toolsLabel')}>
        <button aria-pressed={showLabels} onClick={() => onLabels(!showLabels)} title={t('showLabelsTitle')}><Tag size={15} /><span>{t('showLabels')}</span></button>
        <button aria-pressed={motion} onClick={() => onMotion(!motion)} title={t('motionTitle')} aria-label={t('motion')}><Orbit size={15} /><span>{t('motion')}</span></button>
        <button aria-expanded={showClusters} onClick={() => setShowClusters(!showClusters)} title={t('clusters')}><Layers size={15} /><span>{t('clusters')}</span></button>
        {spotlight !== null && <button className={styles.spotChip} style={{ '--c': clusterColor(spotlight) }} onClick={() => onSpotlight(null)} aria-label={t('clearSpotlight')} title={t('clearCluster', { label })}><span className={styles.dot} /><span>{label} · {cluster?.count}</span><strong className={styles.spotNum}>{spotlight < 0 ? '–' : spotlight}</strong><X size={14} /></button>}
        {showClusters && <section className={styles.clusters} aria-label={t('spotlightLabel')}>
          <div className={styles.clusterGrid}>
            {clusters.map((item) => <button key={item.id} aria-pressed={spotlight === item.id} onClick={() => chooseCluster(item.id)} title={item.examples.join(' · ')} style={{ '--c': clusterColor(item.id) }}>
              <strong>{item.id < 0 ? '–' : item.id}</strong><small>{item.count}</small>
            </button>)}
          </div>
          {cluster && <div className={styles.clusterWords}>
            <div className={styles.clusterBar}>
              <label className={styles.wordSearch}><Search size={14} /><input value={clusterQuery} onChange={(event) => { setClusterQuery(event.target.value); setShownWords(80); }} placeholder={t('searchCluster', { label: label.toLowerCase(), count: cluster.count })} aria-label={t('findInCluster', { label })} /></label>
              <button className={styles.clusterIcon} onClick={() => { setShowClusters(false); onFrameCluster(cluster.id); }} title={t('zoomToCluster')} aria-label={t('zoomToCluster')}><ScanSearch size={16} /></button>
            </div>
            <div className={styles.wordList} aria-label={t('wordsIn', { label })} style={{ '--c': clusterColor(cluster.id) }}>
              {matchingWords.slice(0, shownWords).map((word) => <button key={word} title={word} onClick={() => onSelect(word)}>{word}</button>)}
              {!matchingWords.length && <p>{t('noMatches')}</p>}
              {matchingWords.length > shownWords && <button className={styles.showMore} onClick={() => setShownWords((count) => count + 80)}>+{matchingWords.length - shownWords}</button>}
            </div>
          </div>}
        </section>}
      </div>

      <div className={`${styles.trayPosition} ${minimalist ? styles.aboveDock : ''}`}>
        {!info && pins.length === 0 && <p className={styles.hint}>{t('hint')}</p>}
        {(info || pins.length > 0) && <section className={`${styles.tray} ${expanded ? styles.expanded : ''}`} aria-label={t('trayLabel')} style={{ '--selection-color': clusterColor(found ? info.cluster : null) }}
          onKeyDown={(event) => { if (event.key === 'Escape') { setExpanded(false); event.stopPropagation(); } }}>
          <div className={styles.header}
              onTouchStart={(event) => { touchY.current = event.touches[0].clientY; }}
              onTouchEnd={(event) => { if (touchY.current !== null) { const delta = touchY.current - event.changedTouches[0].clientY; if (Math.abs(delta) > 30) setExpanded(delta > 0); touchY.current = null; } }}>
            <strong className={styles.wordTitle}>{info?.word ?? pins[0]}</strong>
            {found && <button className={styles.iconButton} aria-pressed={anchored} onClick={() => (anchored ? onUnpin() : onPin(info.word))}
              title={anchored ? t('unpin') : t('pinToCompare')} aria-label={anchored ? t('unpinWord') : t('pinWord')}><Pin size={16} /></button>}
            {found && <button className={styles.iconButton} onClick={onFrame} title={t('locate')} aria-label={t('locate')}><LocateFixed size={16} /></button>}
            {found && <button className={styles.iconButton} aria-pressed={focus} onClick={() => onFocus(!focus)} title={focus ? t('exitFocus') : t('focus')} aria-label={t('focus')}><Focus size={16} /></button>}
            {found && <button className={styles.iconButton} aria-expanded={expanded} aria-label={expanded ? t('collapse') : t('expand')} onClick={() => setExpanded(!expanded)}><ChevronUp size={18} className={styles.chevron} /></button>}
            <button className={styles.iconButton} onClick={info ? onClear : onUnpin} aria-label={info ? t('clearSelection') : t('unpinWord')} title={t('clear')}><X size={16} /></button>
          </div>
          {pins.length === 2 && <div className={styles.compare} aria-label={t('comparison')}>
            <div className={styles.compareTitle}>
              <button className={styles.anchor} onClick={() => onSelect(pins[0])}><Pin size={12} />{pins[0]}</button>
              <GitMerge size={14} />
              <span>{t('shared', { count: shared.length })}</span>
              {direct && <span className={styles.badge} title={t('directlyLinked')}><Link2 size={12} /></span>}
            </div>
            {shared.length > 0 && <div className={styles.chips}>{shared.map((word) => <button key={word} className={styles.sharedChip} onClick={() => onSelect(word)}>{word}</button>)}</div>}
          </div>}
          {pins.length === 1 && !anchored && !info && <p className={styles.note}><Pin size={12} /> {t('selectToCompare')}</p>}
          <div className={styles.body}>
            {info?.state === 'missing' && <p>{t('notIn', { dataset: info.datasetName })}</p>}
            {found && <div className={styles.chips} aria-label={t('storedLinks', { word: info.word })}>
              <Link2 size={14} className={styles.rowIcon} />
              {info.links.map((word) => <button key={word} onClick={() => onSelect(word)}>{word}</button>)}
            </div>}
          </div>
        </section>}
      </div>
    </>
  );
}
