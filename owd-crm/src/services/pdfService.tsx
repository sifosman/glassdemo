import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Svg, Rect, Line, Path } from '@react-pdf/renderer';
import { Quote, CalculatedItem } from './glassQuoteService';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const BRAND = {
  ink: '#111827',
  muted: '#6b7280',
  subtle: '#9ca3af',
  line: '#e5e7eb',
  bg: '#f9fafb',
  primary: '#0f4c81',
  primaryDark: '#0b3458',
  accent: '#d97706',
  danger: '#b91c1c',
};

const styles = StyleSheet.create({
  page: { paddingTop: 112, paddingBottom: 70, paddingHorizontal: 36, fontSize: 10.5, fontFamily: 'Helvetica', color: BRAND.ink },
  header: { position: 'absolute', top: 0, left: 0, right: 0, height: 92 },
  headerTopBand: { height: 14, backgroundColor: BRAND.primaryDark },
  headerBody: { flexDirection: 'row', paddingHorizontal: 36, paddingTop: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: BRAND.line },
  brandBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandText: { flexDirection: 'column' },
  brandName: { fontSize: 18, fontWeight: 700, color: BRAND.primaryDark, letterSpacing: 0.2 },
  brandTagline: { fontSize: 9.5, color: BRAND.muted, marginTop: 2 },
  brandContact: { fontSize: 9.5, color: BRAND.muted, marginTop: 3 },
  docMeta: { width: 210, alignItems: 'flex-end' },
  docTitle: { fontSize: 14, fontWeight: 700, color: BRAND.primaryDark },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  metaKey: { width: 72, fontSize: 9.5, color: BRAND.muted, textAlign: 'right' },
  metaValue: { width: 130, fontSize: 9.5, color: BRAND.ink },
  footer: { position: 'absolute', left: 36, right: 36, bottom: 22, borderTopWidth: 1, borderTopColor: BRAND.line, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerText: { fontSize: 9, color: BRAND.muted },
  pageNumber: { fontSize: 9, color: BRAND.muted },
  sectionTitle: { fontSize: 11.5, fontWeight: 700, color: BRAND.primaryDark, marginBottom: 8, letterSpacing: 0.15 },
  card: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  cardRow: { flexDirection: 'row', gap: 12 },
  keyValueGrid: { flexDirection: 'row', gap: 14 },
  keyValueCol: { flex: 1 },
  kvRow: { flexDirection: 'row', marginBottom: 4 },
  kvKey: { width: 92, fontSize: 9.5, color: BRAND.muted },
  kvValue: { flex: 1, fontSize: 9.5, color: BRAND.ink },
  pill: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 8, backgroundColor: BRAND.bg },
  pillText: { fontSize: 9, color: BRAND.primaryDark },
  table: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, overflow: 'hidden' },
  tableHeader: { backgroundColor: BRAND.bg, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BRAND.line, paddingVertical: 8, paddingHorizontal: 10 },
  th: { fontSize: 9.25, color: BRAND.muted, fontWeight: 700 },
  tr: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  td: { fontSize: 9.75, color: BRAND.ink },
  colRef: { width: 42 },
  colDesc: { flex: 1 },
  colQty: { width: 38, textAlign: 'right' },
  colSize: { width: 92, textAlign: 'right' },
  colSpec: { width: 132 },
  colUnit: { width: 74, textAlign: 'right' },
  colTotal: { width: 80, textAlign: 'right' },
  totalsWrap: { marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  totalsBox: { width: 260, borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalsKey: { fontSize: 9.5, color: BRAND.muted },
  totalsVal: { fontSize: 9.5, color: BRAND.ink, fontWeight: 700 },
  totalsGrandKey: { fontSize: 10.5, color: BRAND.primaryDark, fontWeight: 700 },
  totalsGrandVal: { fontSize: 10.5, color: BRAND.primaryDark, fontWeight: 700 },
  note: { fontSize: 9, color: BRAND.muted, lineHeight: 1.35 },
  hStack: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scheduleHeader: { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  scheduleTitle: { fontSize: 12.5, fontWeight: 700, color: BRAND.primaryDark },
  scheduleSubtitle: { fontSize: 9.25, color: BRAND.muted, marginTop: 3 },
  techGrid: { flexDirection: 'column', gap: 10 },
  techCard: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, padding: 12, backgroundColor: '#fff' },
  techHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  techRef: { fontSize: 10.5, fontWeight: 700, color: BRAND.primaryDark },
  techDesc: { fontSize: 9.25, color: BRAND.muted, marginTop: 2 },
  diagramWrap: { width: 280, height: 210, borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, backgroundColor: BRAND.bg, padding: 8 },
  diagramLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  diagramLabel: { fontSize: 8.75, color: BRAND.muted },
  specBlock: { flex: 1, borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, padding: 10, backgroundColor: '#fff' },
  specTitle: { fontSize: 9.75, fontWeight: 700, color: BRAND.primaryDark, marginBottom: 6 },
  specRow: { flexDirection: 'row', marginBottom: 4 },
  specKey: { width: 106, fontSize: 9.25, color: BRAND.muted },
  specVal: { flex: 1, fontSize: 9.25, color: BRAND.ink },
  divider: { height: 1, backgroundColor: BRAND.line, marginVertical: 10 },
  paymentBadge: { borderWidth: 1, borderColor: BRAND.line, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: BRAND.bg, alignSelf: 'flex-start' },
  paymentBadgeText: { fontSize: 9.5, color: BRAND.primaryDark, fontWeight: 700 },
});

interface QuoteDocumentProps {
  quote: Quote;
}

type DiagramPanel = { kind: 'fixed' | 'sliding'; widthMm?: number; label?: string };
type DiagramModel = {
  kind: 'window' | 'sliding_door';
  widthMm: number;
  heightMm: number;
  panels: DiagramPanel[];
  viewFromOutside: boolean;
};

const formatMoney = (value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `R ${safe.toFixed(2)}`;
};

const formatDateZA = (iso: string) => {
  const date = iso ? new Date(iso) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString('en-ZA');
  return date.toLocaleDateString('en-ZA');
};

const parseSizeMm = (size: string): { widthMm: number; heightMm: number } | null => {
  const match = String(size || '').match(/(\d{2,5})\s*x\s*(\d{2,5})/i);
  if (!match) return null;
  return { widthMm: Number(match[1]), heightMm: Number(match[2]) };
};

const inferKind = (item: Pick<CalculatedItem, 'description' | 'systemName'>): DiagramModel['kind'] | null => {
  const hay = `${item.systemName || ''} ${item.description || ''}`.toLowerCase();
  if (hay.includes('certificate')) return null;
  if (hay.includes('clip 44') || hay.includes('shop front') || hay.includes('shopfront')) return 'sliding_door';
  if (hay.includes('door')) return 'sliding_door';
  if (hay.includes('swift 28') || hay.includes('window')) return 'window';
  if (hay.includes('swift 38') || hay.includes('panel')) return 'window';
  return null;
};

const normalizeOpeningToken = (raw: string) => raw.toLowerCase().replace(/\s+/g, '');

const inferPanels = (kind: DiagramModel['kind'], widthMm: number, description: string): DiagramPanel[] => {
  const hay = normalizeOpeningToken(description || '');
  if (kind === 'window' && hay.includes('panel')) {
    return [{ kind: 'fixed', label: 'FIXED' }];
  }
  const explicitPanels = hay.match(/(\d)\s*(panel|pnl)/);
  const xoToken = hay.match(/\b([ox]{2,4})\b/);

  let panelCount = kind === 'sliding_door' ? 2 : 2;
  if (explicitPanels) panelCount = Math.max(2, Math.min(4, Number(explicitPanels[1])));
  if (xoToken) panelCount = Math.max(2, Math.min(4, xoToken[1].length));

  if (!explicitPanels && !xoToken) {
    if (kind === 'sliding_door') {
      panelCount = widthMm >= 3600 ? 4 : widthMm >= 3000 ? 3 : 2;
    } else {
      panelCount = widthMm >= 2400 ? 3 : 2;
    }
  }

  const pattern = xoToken ? xoToken[1] : panelCount === 4 ? 'xoxx' : panelCount === 3 ? 'xox' : 'xo';
  const panels: DiagramPanel[] = [];
  for (let i = 0; i < panelCount; i++) {
    const char = pattern[i] || (i === panelCount - 1 ? 'o' : 'x');
    panels.push({ kind: char === 'o' ? 'sliding' : 'fixed', label: char === 'o' ? 'SLIDER' : 'FIXED' });
  }
  return panels;
};

const buildDiagramModel = (item: CalculatedItem, size: { widthMm: number; heightMm: number }): DiagramModel | null => {
  const kind = inferKind(item);
  if (!kind) return null;

  const widthMm = Math.max(100, Number(size.widthMm || 0));
  const heightMm = Math.max(100, Number(size.heightMm || 0));
  const panels = inferPanels(kind, widthMm, item.description || item.systemName || '');
  return { kind, widthMm, heightMm, panels, viewFromOutside: true };
};

const splitIntoPages = <T,>(items: T[], perPage: number) => {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  return pages;
};

const LogoMark = () => (
  <Svg width={30} height={30} viewBox="0 0 24 24">
    <Rect x="1.25" y="2.25" width="21.5" height="19.5" rx="3.5" stroke={BRAND.primaryDark} strokeWidth="1.6" fill="#fff" />
    <Line x1="1.75" y1="8" x2="22.25" y2="8" stroke={BRAND.line} strokeWidth="1" />
    <Line x1="12" y1="8.3" x2="12" y2="21.3" stroke={BRAND.line} strokeWidth="1" />
    <Rect x="4.3" y="10.4" width="6.6" height="8.4" stroke={BRAND.primary} strokeWidth="1.4" fill={BRAND.bg} />
    <Rect x="13.1" y="10.4" width="6.6" height="8.4" stroke={BRAND.primary} strokeWidth="1.4" fill={BRAND.bg} />
  </Svg>
);

const PdfHeader = (props: { title: string; meta: Array<{ k: string; v: string }> }) => (
  <View style={styles.header} fixed>
    <View style={styles.headerTopBand} />
    <View style={styles.headerBody}>
      <View style={styles.brandBlock}>
        <LogoMark />
        <View style={styles.brandText}>
          <Text style={styles.brandName}>OWD Glass</Text>
          <Text style={styles.brandTagline}>Professional Glazing Solutions | SANS 10400-N Compliant</Text>
          <Text style={styles.brandContact}>info@owdglass.co.za • +27 12 345 6789</Text>
        </View>
      </View>
      <View style={styles.docMeta}>
        <Text style={styles.docTitle}>{props.title}</Text>
        {props.meta.map((row, idx) => (
          <View key={`${row.k}-${idx}`} style={styles.metaRow}>
            <Text style={styles.metaKey}>{row.k}</Text>
            <Text style={styles.metaValue}>{row.v}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

const PdfFooter = (props: { left: string; right?: string }) => (
  <View style={styles.footer} fixed>
    <Text style={styles.footerText}>{props.left}</Text>
    <Text
      style={styles.pageNumber}
      render={({ pageNumber, totalPages }) => `${props.right ? `${props.right} • ` : ''}Page ${pageNumber} of ${totalPages}`}
    />
  </View>
);

const arrowHeadPath = (x: number, y: number, dir: 'left' | 'right' | 'up' | 'down', size: number) => {
  const s = size;
  if (dir === 'left') return `M ${x} ${y} L ${x + s} ${y - s * 0.65} L ${x + s} ${y + s * 0.65} Z`;
  if (dir === 'right') return `M ${x} ${y} L ${x - s} ${y - s * 0.65} L ${x - s} ${y + s * 0.65} Z`;
  if (dir === 'up') return `M ${x} ${y} L ${x - s * 0.65} ${y + s} L ${x + s * 0.65} ${y + s} Z`;
  return `M ${x} ${y} L ${x - s * 0.65} ${y - s} L ${x + s * 0.65} ${y - s} Z`;
};

const TechnicalDiagram = (props: { model: DiagramModel }) => {
  const vbW = 320;
  const vbH = 220;
  const marginLeft = 54;
  const marginRight = 18;
  const marginTop = 30;
  const marginBottom = 44;

  const maxW = vbW - marginLeft - marginRight;
  const maxH = vbH - marginTop - marginBottom;
  const scale = Math.min(maxW / props.model.widthMm, maxH / props.model.heightMm);
  const drawW = props.model.widthMm * scale;
  const drawH = props.model.heightMm * scale;
  const originX = marginLeft + (maxW - drawW) / 2;
  const originY = marginTop + (maxH - drawH) / 2;

  const totalPanels = Math.max(2, props.model.panels.length);
  const panelWidthsMm = props.model.panels.map((p) => p.widthMm).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const totalWidthFromPanels = panelWidthsMm.reduce((a, b) => a + b, 0);
  const equalWidthMm = props.model.widthMm / totalPanels;

  const effectivePanelWidthsMm = props.model.panels.map((p) => {
    if (typeof p.widthMm === 'number' && Number.isFinite(p.widthMm)) return p.widthMm;
    if (totalWidthFromPanels > 0 && panelWidthsMm.length === props.model.panels.length) return p.widthMm as number;
    return equalWidthMm;
  });

  const panelXs: number[] = [];
  let xCursor = originX;
  for (let i = 0; i < totalPanels; i++) {
    panelXs.push(xCursor);
    const wMm = effectivePanelWidthsMm[i] ?? equalWidthMm;
    xCursor += wMm * scale;
  }

  const dimStroke = BRAND.subtle;
  const frameStroke = BRAND.primaryDark;
  const innerStroke = '#94a3b8';
  const arrowSize = 4.5;

  const topDimY = originY - 16;
  const leftDimX = originX - 18;

  const diagramTitle = props.model.kind === 'sliding_door' ? 'Sliding Door' : 'Window';

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`}>
      <Rect x="0" y="0" width={vbW} height={vbH} fill={BRAND.bg} />

      <Text x="10" y="18" style={{ fontSize: 9.25, fill: BRAND.muted }}>
        {diagramTitle} (not to scale in print)
      </Text>

      <Rect x={originX} y={originY} width={drawW} height={drawH} fill="#fff" stroke={frameStroke} strokeWidth="2" />

      {panelXs.slice(1).map((x, i) => (
        <Line key={`mullion-${i}`} x1={x} y1={originY} x2={x} y2={originY + drawH} stroke={innerStroke} strokeWidth="1.6" />
      ))}

      {props.model.kind === 'sliding_door' ? (
        <>
          <Line x1={originX} y1={originY + drawH + 4} x2={originX + drawW} y2={originY + drawH + 4} stroke={innerStroke} strokeWidth="1.5" />
          <Line x1={originX} y1={originY + drawH + 7} x2={originX + drawW} y2={originY + drawH + 7} stroke={innerStroke} strokeWidth="1.5" />
        </>
      ) : (
        <Line x1={originX} y1={originY + drawH + 5} x2={originX + drawW} y2={originY + drawH + 5} stroke={innerStroke} strokeWidth="1.2" />
      )}

      {props.model.panels.map((p, idx) => {
        const x0 = panelXs[idx] ?? originX;
        const wMm = effectivePanelWidthsMm[idx] ?? equalWidthMm;
        const w = wMm * scale;
        const cx = x0 + w / 2;
        const cy = originY + drawH / 2;

        if (p.kind === 'sliding') {
          const y = originY + drawH - 16;
          const fromX = x0 + 10;
          const toX = x0 + w - 10;
          return (
            <React.Fragment key={`panel-${idx}`}>
              <Line x1={fromX} y1={y} x2={toX} y2={y} stroke={BRAND.accent} strokeWidth="1.8" />
              <Path d={arrowHeadPath(toX, y, 'right', arrowSize)} fill={BRAND.accent} />
              <Text x={cx - 16} y={cy + 4} style={{ fontSize: 8.5, fill: BRAND.muted }}>
                SLIDER
              </Text>
            </React.Fragment>
          );
        }

        const inset = 10;
        return (
          <React.Fragment key={`panel-${idx}`}>
            <Line x1={x0 + inset} y1={originY + inset} x2={x0 + w - inset} y2={originY + drawH - inset} stroke="#cbd5e1" strokeWidth="1" />
            <Line x1={x0 + w - inset} y1={originY + inset} x2={x0 + inset} y2={originY + drawH - inset} stroke="#cbd5e1" strokeWidth="1" />
            <Text x={cx - 16} y={cy + 4} style={{ fontSize: 8.5, fill: BRAND.muted }}>
              FIXED
            </Text>
          </React.Fragment>
        );
      })}

      <Line x1={originX} y1={topDimY} x2={originX + drawW} y2={topDimY} stroke={dimStroke} strokeWidth="1" />
      <Path d={arrowHeadPath(originX, topDimY, 'left', arrowSize)} fill={dimStroke} />
      <Path d={arrowHeadPath(originX + drawW, topDimY, 'right', arrowSize)} fill={dimStroke} />
      <Text x={originX + drawW / 2 - 30} y={topDimY - 4} style={{ fontSize: 9, fill: BRAND.muted }}>
        W {Math.round(props.model.widthMm)} mm
      </Text>

      <Line x1={leftDimX} y1={originY} x2={leftDimX} y2={originY + drawH} stroke={dimStroke} strokeWidth="1" />
      <Path d={arrowHeadPath(leftDimX, originY, 'up', arrowSize)} fill={dimStroke} />
      <Path d={arrowHeadPath(leftDimX, originY + drawH, 'down', arrowSize)} fill={dimStroke} />
      <Text x={leftDimX - 36} y={originY + drawH / 2 + 3} style={{ fontSize: 9, fill: BRAND.muted }}>
        H {Math.round(props.model.heightMm)} mm
      </Text>

      {panelXs.map((x, idx) => {
        const wMm = effectivePanelWidthsMm[idx] ?? equalWidthMm;
        const w = wMm * scale;
        const y = originY - 4;
        const x1 = x;
        const x2 = x + w;
        const labelX = x1 + w / 2 - 18;
        return (
          <React.Fragment key={`pdim-${idx}`}>
            <Line x1={x1} y1={y} x2={x2} y2={y} stroke="#cbd5e1" strokeWidth="0.9" />
            <Path d={arrowHeadPath(x1, y, 'left', 3.8)} fill="#cbd5e1" />
            <Path d={arrowHeadPath(x2, y, 'right', 3.8)} fill="#cbd5e1" />
            <Text x={labelX} y={y - 2} style={{ fontSize: 7.8, fill: BRAND.subtle }}>
              {Math.round(wMm)} mm
            </Text>
          </React.Fragment>
        );
      })}
    </Svg>
  );
};

const buildItemRefs = (items: CalculatedItem[]) => {
  const windowItems: Array<{ item: CalculatedItem; ref: string; diagram: DiagramModel | null }> = [];
  let w = 0;
  let d = 0;

  for (const item of items) {
    const size = parseSizeMm(item.size_mm);
    const diagram = size ? buildDiagramModel(item, size) : null;
    const kind = diagram?.kind || inferKind(item);
    if (kind === 'window') {
      w += 1;
      windowItems.push({ item, ref: `W${String(w).padStart(2, '0')}`, diagram });
      continue;
    }
    if (kind === 'sliding_door') {
      d += 1;
      windowItems.push({ item, ref: `D${String(d).padStart(2, '0')}`, diagram });
      continue;
    }
    windowItems.push({ item, ref: `I${String(windowItems.length + 1).padStart(2, '0')}`, diagram });
  }

  return windowItems;
};

const QuoteDocument: React.FC<QuoteDocumentProps> = ({ quote }) => {
  const createdDate = formatDateZA(quote.createdDate);
  const expiryDate = quote.expiryDate ? formatDateZA(quote.expiryDate) : '';

  const rows = buildItemRefs(quote.items);
  const scheduleRows = rows.filter((r) => r.diagram);
  const schedulePages = splitIntoPages(scheduleRows, 1);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="Quotation"
          meta={[
            { k: 'Quote No', v: quote.quoteNumber },
            { k: 'Date', v: createdDate },
            ...(expiryDate ? [{ k: 'Valid Until', v: expiryDate }] : []),
          ]}
        />
        <PdfFooter left="Quote valid as per validity date. Installation subject to final site measure." right="OWD Glass" />

        <View style={styles.hStack}>
          <Text style={styles.sectionTitle}>Customer & Project</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>All dimensions in millimetres (mm)</Text>
          </View>
        </View>

        <View style={[styles.card, { marginBottom: 12 }]}>
          <View style={styles.keyValueGrid}>
            <View style={styles.keyValueCol}>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Customer</Text>
                <Text style={styles.kvValue}>{quote.customer.name}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Email</Text>
                <Text style={styles.kvValue}>{quote.customer.email || '-'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Phone</Text>
                <Text style={styles.kvValue}>{quote.customer.phone || '-'}</Text>
              </View>
            </View>
            <View style={styles.keyValueCol}>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Site Address</Text>
                <Text style={styles.kvValue}>{quote.customer.address || '-'}</Text>
              </View>
              <View style={styles.kvRow}>
                <Text style={styles.kvKey}>Safety Glass</Text>
                <Text style={styles.kvValue}>{quote.requiresSafetyGlass ? 'Required' : 'Not required'}</Text>
              </View>
            </View>
          </View>
          {quote.requiresSafetyGlass ? (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.note}>Safety glazing will be applied per SANS 10400-N where required. Item-by-item notes are shown in the Technical Schedule.</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Quotation Items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colRef]}>Ref</Text>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colSize]}>Size</Text>
            <Text style={[styles.th, styles.colSpec]}>Specification</Text>
            <Text style={[styles.th, styles.colUnit]}>Unit</Text>
            <Text style={[styles.th, styles.colTotal]}>Line</Text>
          </View>
          {rows.map((r) => (
            <View key={r.ref} style={styles.tr}>
              <Text style={[styles.td, styles.colRef]}>{r.ref}</Text>
              <Text style={[styles.td, styles.colDesc]}>{r.item.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{r.item.quantity}</Text>
              <Text style={[styles.td, styles.colSize]}>{r.item.size_mm}</Text>
              <Text style={[styles.td, styles.colSpec]}>
                {(r.item.systemName ? `${r.item.systemName} • ` : '') + (r.item.glassSpec ? `${r.item.glassSpec.thickness} ${r.item.glassSpec.type}` : 'Glass')}
              </Text>
              <Text style={[styles.td, styles.colUnit]}>{formatMoney(r.item.unitPrice)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatMoney(r.item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsKey}>Subtotal</Text>
              <Text style={styles.totalsVal}>{formatMoney(quote.subtotal)}</Text>
            </View>
            {quote.discountAmount > 0 ? (
              <View style={styles.totalsRow}>
                <Text style={styles.totalsKey}>Discount ({quote.discountPercent}%)</Text>
                <Text style={styles.totalsVal}>-{formatMoney(quote.discountAmount)}</Text>
              </View>
            ) : null}
            <View style={styles.totalsRow}>
              <Text style={styles.totalsKey}>VAT ({quote.vatRate}%)</Text>
              <Text style={styles.totalsVal}>{formatMoney(quote.vatAmount)}</Text>
            </View>
            <View style={[styles.totalsRow, { marginBottom: 0 }]}>
              <Text style={styles.totalsGrandKey}>Total</Text>
              <Text style={styles.totalsGrandVal}>{formatMoney(quote.total)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={styles.note}>
            Lead time and installation dates are confirmed after final on-site measure. All glazing will be supplied and installed in accordance with SANS 10400-N where applicable.
          </Text>
        </View>
      </Page>

      {schedulePages.map((pageRows, pageIdx) => (
        <Page key={`sched-${pageIdx}`} size="A4" style={styles.page}>
          <PdfHeader
            title="Quotation • Technical Schedule"
            meta={[
              { k: 'Quote No', v: quote.quoteNumber },
              { k: 'Date', v: createdDate },
              { k: 'Schedule', v: `${pageIdx + 1} / ${schedulePages.length}` },
            ]}
          />
          <PdfFooter left="Diagrams indicate configuration and measured sizes for manufacturing." right="OWD Glass" />

          <View style={styles.scheduleHeader}>
            <View>
              <Text style={styles.scheduleTitle}>Technical Diagrams & Measurements</Text>
              <Text style={styles.scheduleSubtitle}>All measurements shown are overall frame sizes unless stated otherwise.</Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>View: Outside</Text>
            </View>
          </View>

          <View style={styles.techGrid}>
            {pageRows.map((r) => (
              <View key={`tech-${r.ref}`} style={styles.techCard}>
                <View style={styles.techHeader}>
                  <View>
                    <Text style={styles.techRef}>{r.ref}</Text>
                    <Text style={styles.techDesc}>{r.item.description}</Text>
                  </View>
                  <View style={styles.pill}>
                    <Text style={styles.pillText}>Qty {r.item.quantity}</Text>
                  </View>
                </View>

                <View style={styles.cardRow}>
                  <View style={styles.diagramWrap}>
                    {r.diagram ? <TechnicalDiagram model={r.diagram} /> : null}
                    <View style={styles.diagramLabelRow}>
                      <Text style={styles.diagramLabel}>{r.item.size_mm}</Text>
                      <Text style={styles.diagramLabel}>{r.diagram?.kind === 'sliding_door' ? 'Sliding Door' : 'Window'}</Text>
                    </View>
                  </View>

                  <View style={styles.specBlock}>
                    <Text style={styles.specTitle}>Specification</Text>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>System</Text>
                      <Text style={styles.specVal}>{r.item.systemName || '-'}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>Frame Finish</Text>
                      <Text style={styles.specVal}>
                        {(r.item.powderCoatCode ? `${r.item.powderCoatCode} • ` : '') + (r.item.frameColor || 'Standard')}
                      </Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>Glass</Text>
                      <Text style={styles.specVal}>{r.item.glassSpec ? `${r.item.glassSpec.thickness} ${r.item.glassSpec.type}` : '-'}</Text>
                    </View>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>Safety</Text>
                      <Text style={styles.specVal}>{r.item.is_safety_glass ? 'Yes' : 'No'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.specTitle}>Measurements</Text>
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>Overall</Text>
                      <Text style={styles.specVal}>{r.item.size_mm} mm</Text>
                    </View>
                    {r.diagram ? (
                      <View style={styles.specRow}>
                        <Text style={styles.specKey}>Panels</Text>
                        <Text style={styles.specVal}>
                          {r.diagram.panels.map((p) => (p.kind === 'sliding' ? 'O' : 'X')).join('')}
                        </Text>
                      </View>
                    ) : null}
                    <View style={styles.specRow}>
                      <Text style={styles.specKey}>Area (m²)</Text>
                      <Text style={styles.specVal}>{Number.isFinite(r.item.area_m2) ? r.item.area_m2.toFixed(2) : '-'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
};

export class PDFService {
  private async toNodeBuffer(value: unknown): Promise<Buffer> {
    if (Buffer.isBuffer(value)) {
      return value;
    }

    if (value instanceof Uint8Array) {
      return Buffer.from(value);
    }

    if (value instanceof ArrayBuffer) {
      return Buffer.from(new Uint8Array(value));
    }

    const maybeHasArrayBuffer = value as { arrayBuffer?: () => Promise<ArrayBuffer> };
    if (maybeHasArrayBuffer && typeof maybeHasArrayBuffer.arrayBuffer === 'function') {
      const buffer = await maybeHasArrayBuffer.arrayBuffer();
      return Buffer.from(new Uint8Array(buffer));
    }

    const maybeStream = value as {
      getReader?: () => { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
    };
    if (maybeStream && typeof maybeStream.getReader === 'function') {
      const reader = maybeStream.getReader();
      const chunks: Buffer[] = [];

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        if (chunk) chunks.push(Buffer.from(chunk));
      }

      return Buffer.concat(chunks);
    }

    const maybeAsyncIterable = value as AsyncIterable<unknown> & { [Symbol.asyncIterator]?: () => AsyncIterator<unknown> };
    if (maybeAsyncIterable && typeof maybeAsyncIterable[Symbol.asyncIterator] === 'function') {
      const chunks: Buffer[] = [];
      for await (const chunk of maybeAsyncIterable) {
        if (typeof chunk === 'string') {
          chunks.push(Buffer.from(chunk));
        } else if (chunk instanceof Uint8Array) {
          chunks.push(Buffer.from(chunk));
        } else if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        }
      }
      if (chunks.length > 0) {
        return Buffer.concat(chunks);
      }
    }

    const maybeNodeStream = value as {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
    };
    if (maybeNodeStream && typeof maybeNodeStream.on === 'function') {
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        maybeNodeStream.on?.('data', (chunk: unknown) => {
          if (typeof chunk === 'string') chunks.push(Buffer.from(chunk));
          else if (chunk instanceof Uint8Array) chunks.push(Buffer.from(chunk));
          else if (Buffer.isBuffer(chunk)) chunks.push(chunk);
        });
        maybeNodeStream.on?.('end', () => resolve());
        maybeNodeStream.on?.('error', (err: unknown) => reject(err));
      });
      if (chunks.length > 0) {
        return Buffer.concat(chunks);
      }
    }

    throw new Error('Failed to convert PDF output to Buffer');
  }

  async generateQuotePDF(quote: Quote): Promise<Buffer> {
    try {
      const instance = pdf(<QuoteDocument quote={quote} />);
      try {
        const output = await instance.toBuffer();
        return await this.toNodeBuffer(output);
      } catch {
        const blob = await (instance as unknown as { toBlob: () => Promise<unknown> }).toBlob();
        return await this.toNodeBuffer(blob);
      }
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  async generateInvoicePDF(
    quote: Quote & { depositPaid?: number; depositAmount?: number },
    paymentData: { pf_payment_id?: string; invoice_number?: string } | null
  ): Promise<Buffer> {
    try {
      const depositPaid = Number(quote.depositPaid || quote.depositAmount || 0);
      const remainingBalance = quote.total - depositPaid;
      
      const transactionRef = paymentData?.pf_payment_id || 'N/A';
      const invoiceNumber = paymentData?.invoice_number || `INV-${quote.quoteNumber}`;

      const InvoiceDocument = (
        <Document>
          <Page size="A4" style={styles.page}>
            <PdfHeader
              title="Tax Invoice"
              meta={[
                { k: 'Invoice No', v: invoiceNumber },
                { k: 'Quote No', v: quote.quoteNumber },
                { k: 'Date', v: formatDateZA(new Date().toISOString()) },
              ]}
            />
            <PdfFooter left="Payment terms: balance due upon completion of installation unless otherwise agreed." right="OWD Glass" />

            <View style={[styles.card, { marginBottom: 12 }]}>
              <View style={styles.hStack}>
                <Text style={styles.sectionTitle}>Bill To</Text>
                <View style={styles.paymentBadge}>
                  <Text style={styles.paymentBadgeText}>PAID (Deposit)</Text>
                </View>
              </View>
              <View style={[styles.keyValueGrid, { marginTop: 6 }]}>
                <View style={styles.keyValueCol}>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Customer</Text>
                    <Text style={styles.kvValue}>{quote.customer.name}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Email</Text>
                    <Text style={styles.kvValue}>{quote.customer.email || '-'}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Phone</Text>
                    <Text style={styles.kvValue}>{quote.customer.phone || '-'}</Text>
                  </View>
                </View>
                <View style={styles.keyValueCol}>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Billing Address</Text>
                    <Text style={styles.kvValue}>{quote.customer.address || '-'}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Transaction Ref</Text>
                    <Text style={styles.kvValue}>{transactionRef}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Payment Summary</Text>
            <View style={[styles.card, { marginBottom: 12 }]}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsKey}>Total Quote Value</Text>
                <Text style={styles.totalsVal}>{formatMoney(quote.total)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsKey}>Deposit Received</Text>
                <Text style={styles.totalsVal}>{formatMoney(depositPaid)}</Text>
              </View>
              <View style={[styles.totalsRow, { marginBottom: 0 }]}>
                <Text style={styles.totalsGrandKey}>Balance Due</Text>
                <Text style={styles.totalsGrandVal}>{formatMoney(remainingBalance)}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Itemised Billing</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, styles.colDesc]}>Description</Text>
                <Text style={[styles.th, styles.colQty]}>Qty</Text>
                <Text style={[styles.th, styles.colSize]}>Size</Text>
                <Text style={[styles.th, styles.colTotal]}>Line</Text>
              </View>
              {Array.isArray(quote.items) ? (
                (quote.items as CalculatedItem[]).map((item, index) => (
                  <View key={`inv-${index}`} style={styles.tr}>
                    <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                    <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
                    <Text style={[styles.td, styles.colSize]}>{item.size_mm}</Text>
                    <Text style={[styles.td, styles.colTotal]}>{formatMoney(item.totalPrice)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.tr}>
                  <Text style={[styles.td, styles.colDesc]}>-</Text>
                  <Text style={[styles.td, styles.colQty]}>-</Text>
                  <Text style={[styles.td, styles.colSize]}>-</Text>
                  <Text style={[styles.td, styles.colTotal]}>-</Text>
                </View>
              )}
            </View>

            <View style={styles.totalsWrap}>
              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsKey}>Subtotal</Text>
                  <Text style={styles.totalsVal}>{formatMoney(quote.subtotal)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsKey}>VAT</Text>
                  <Text style={styles.totalsVal}>{formatMoney(quote.vatAmount)}</Text>
                </View>
                <View style={[styles.totalsRow, { marginBottom: 0 }]}>
                  <Text style={styles.totalsGrandKey}>Total</Text>
                  <Text style={styles.totalsGrandVal}>{formatMoney(quote.total)}</Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={styles.note}>
                This invoice reflects the deposit received for the above quotation. The remaining balance is due strictly upon completion of installation unless otherwise agreed in writing.
              </Text>
            </View>
          </Page>
        </Document>
      );

      const instance = pdf(InvoiceDocument);
      try {
        const output = await instance.toBuffer();
        return await this.toNodeBuffer(output);
      } catch {
        const blob = await (instance as unknown as { toBlob: () => Promise<unknown> }).toBlob();
        return await this.toNodeBuffer(blob);
      }
      
    } catch (error) {
      console.error('Error generating Invoice PDF:', error);
      throw new Error('Failed to generate Invoice PDF');
    }
  }

  async generateStatementPDF(
    quote: Quote & { depositPaid?: number; depositAmount?: number; balancePaid?: number; balancePaidAt?: string },
    paymentHistory: Array<{ type: 'deposit' | 'balance'; amount: number; date: string; transactionRef: string }>
  ): Promise<Buffer> {
    try {
      const StatementDocument = (
        <Document>
          <Page size="A4" style={styles.page}>
            <PdfHeader
              title="Statement of Account"
              meta={[
                { k: 'Quote No', v: quote.quoteNumber },
                { k: 'Date', v: formatDateZA(new Date().toISOString()) },
              ]}
            />
            <PdfFooter left="This statement reflects all charges and payments for your records." right="OWD Glass" />

            <View style={[styles.card, { marginBottom: 12 }]}>
              <Text style={styles.sectionTitle}>Customer Information</Text>
              <View style={[styles.keyValueGrid, { marginTop: 6 }]}>
                <View style={styles.keyValueCol}>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Customer</Text>
                    <Text style={styles.kvValue}>{quote.customer.name}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Email</Text>
                    <Text style={styles.kvValue}>{quote.customer.email || '-'}</Text>
                  </View>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Phone</Text>
                    <Text style={styles.kvValue}>{quote.customer.phone || '-'}</Text>
                  </View>
                </View>
                <View style={styles.keyValueCol}>
                  <View style={styles.kvRow}>
                    <Text style={styles.kvKey}>Billing Address</Text>
                    <Text style={styles.kvValue}>{quote.customer.address || '-'}</Text>
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Transaction History</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Description</Text>
                <Text style={[styles.th, { width: 80, textAlign: 'right' }]}>Date</Text>
                <Text style={[styles.th, { width: 80, textAlign: 'right' }]}>Amount</Text>
                <Text style={[styles.th, { width: 80, textAlign: 'right' }]}>Status</Text>
              </View>

              {/* Quote Total Row */}
              <View style={styles.tr}>
                <Text style={[styles.td, { flex: 2 }]}>Quote Total - {quote.quoteNumber}</Text>
                <Text style={[styles.td, { width: 80, textAlign: 'right' }]}>{formatDateZA(quote.createdDate)}</Text>
                <Text style={[styles.td, { width: 80, textAlign: 'right' }]}>{formatMoney(quote.total)}</Text>
                <Text style={[styles.td, { width: 80, textAlign: 'right' }]}>Billed</Text>
              </View>

              {/* Payment Rows */}
              {paymentHistory.map((payment, idx) => (
                <View key={`payment-${idx}`} style={styles.tr}>
                  <Text style={[styles.td, { flex: 2 }]}>
                    {payment.type === 'deposit' ? 'Deposit Payment' : 'Final Balance Payment'}
                    {payment.transactionRef ? ` (Ref: ${payment.transactionRef})` : ''}
                  </Text>
                  <Text style={[styles.td, { width: 80, textAlign: 'right' }]}>{formatDateZA(payment.date)}</Text>
                  <Text style={[styles.td, { width: 80, textAlign: 'right', color: BRAND.primary }]}>
                    -{formatMoney(payment.amount)}
                  </Text>
                  <Text style={[styles.td, { width: 80, textAlign: 'right', color: '#16a34a' }]}>Paid</Text>
                </View>
              ))}
            </View>

            <View style={styles.totalsWrap}>
              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsKey}>Total Billed</Text>
                  <Text style={styles.totalsVal}>{formatMoney(quote.total)}</Text>
                </View>
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsKey}>Total Paid</Text>
                  <Text style={[styles.totalsVal, { color: BRAND.primary }]}>
                    {formatMoney(paymentHistory.reduce((sum, p) => sum + p.amount, 0))}
                  </Text>
                </View>
                <View style={[styles.totalsRow, { marginBottom: 0 }]}>
                  <Text style={styles.totalsGrandKey}>Balance</Text>
                  <Text style={[styles.totalsGrandVal, { color: '#16a34a' }]}>
                    {formatMoney(quote.total - paymentHistory.reduce((sum, p) => sum + p.amount, 0))}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginTop: 20, alignItems: 'center' }}>
              <View style={[styles.paymentBadge, { backgroundColor: '#dcfce7', borderColor: '#16a34a' }]}>
                <Text style={[styles.paymentBadgeText, { color: '#16a34a' }]}>ACCOUNT PAID IN FULL</Text>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={styles.note}>
                Thank you for your business. This statement confirms that all payments have been received
                and your account is settled. Please retain this document for your records.
              </Text>
            </View>
          </Page>
        </Document>
      );

      const instance = pdf(StatementDocument);
      try {
        const output = await instance.toBuffer();
        return await this.toNodeBuffer(output);
      } catch {
        const blob = await (instance as unknown as { toBlob: () => Promise<unknown> }).toBlob();
        return await this.toNodeBuffer(blob);
      }
    } catch (error) {
      console.error('Error generating Statement PDF:', error);
      throw new Error('Failed to generate Statement PDF');
    }
  }

  async savePDF(
    pdfBuffer: Buffer,
    referenceNumber: string,
    isInvoice: boolean = false
  ): Promise<{ pdfUrl: string; storagePath: string; fileName: string }> {
    try {
      const fileName = isInvoice ? `${referenceNumber}-invoice.pdf` : `${referenceNumber}.pdf`;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const bucket = process.env.SUPABASE_PDF_BUCKET || 'documents';
      const folder = isInvoice ? 'invoices' : 'quotes';
      const storagePath = `${folder}/${fileName}`;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        });

        const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
        const pdfUrl = data.publicUrl;
        return { pdfUrl, storagePath, fileName };
      }

      const quotesDir = path.join(process.cwd(), 'public', 'quotes');
      if (!fs.existsSync(quotesDir)) {
        fs.mkdirSync(quotesDir, { recursive: true });
      }

      const filePath = path.join(quotesDir, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      return { pdfUrl: `${baseUrl}/quotes/${fileName}`, storagePath: `quotes/${fileName}`, fileName };
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw new Error('Failed to save PDF');
    }
  }
}
