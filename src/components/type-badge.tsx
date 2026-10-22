'use client';
import { useT } from '@/lib/i18n/locale';

import { useEffect, useId, useRef } from 'react';
import { TYPE_NAMES, type PokemonType } from '@/domain/types';
import { speakText, stopVoice } from '@/lib/voice-audio';
import { TypeSymbol } from './type-symbol';

export function useTypeVoice() {
  const owner = useId();
  const activeOwner = useRef(owner);
  useEffect(() => () => stopVoice(activeOwner.current), []);
  return (type: PokemonType) => {
    activeOwner.current = `${owner}-${type}`;
    speakText(activeOwner.current, TYPE_NAMES[type]);
  };
}

export function TypeBadge({ type, multiplier }: { type: PokemonType; multiplier?: number }) {
  const localize = useT();
  const speak = useTypeVoice();
  return <button type="button" className={`type-badge type-${type}`} aria-label={localize(`听听${TYPE_NAMES[type]}属性${multiplier !== undefined ? `，效果${multiplier}倍` : ''}`)} onClick={() => speak(type)}><span className="type-icon"><TypeSymbol type={type} size={18} /></span>{localize(TYPE_NAMES[type])}{multiplier !== undefined && <b>×{localize(multiplier)}</b>}</button>;
}

export function TypePicture({ type, interactive = true }: { type: PokemonType; interactive?: boolean }) {
  const localize = useT();
  const speak = useTypeVoice();
  const content = <><TypeSymbol type={type} size={32} /><span>{localize(TYPE_NAMES[type])}</span></>;
  return interactive
    ? <button type="button" className={`type-picture type-${type}`} aria-label={localize(`听听${TYPE_NAMES[type]}属性`)} onClick={() => speak(type)}>{localize(content)}</button>
    : <span className={`type-picture type-${type}`}>{localize(content)}</span>;
}
