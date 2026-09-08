'use client';
import { Delete, RotateCcw } from 'lucide-react';
import { normalizeRewardCode } from '@/domain/reward-code';

export function RewardKeypad({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  return <div className="reward-keypad">
    <label className="reward-code-label"><span>六位奖励码</span><div className="reward-code-display">
      <input aria-label="六位奖励码，也可以用键盘或粘贴输入" aria-describedby="reward-code-hint" value={value} onChange={event => onChange(normalizeRewardCode(event.target.value))} inputMode="none" autoComplete="off" spellCheck={false} required pattern="[0-9]{6}" disabled={disabled} />
      <div className="reward-code-slots" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span className={`${value[index] ? 'filled' : ''} ${index === value.length ? 'next-digit' : ''}`} key={index}>{value[index] ?? <i />}</span>)}</div>
    </div></label>
    <p id="reward-code-hint" className="keypad-hint">{value.length === 6 ? '填满啦，打开奖励吧！' : '照着家长给的数字，点一点'}</p>
    <div className="number-pad" role="group" aria-label="奖励码数字键盘">{[1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => <button type="button" disabled={disabled || value.length === 6} key={digit} onClick={() => onChange(value + digit)}>{digit}</button>)}
      <button className="keypad-edit" type="button" disabled={disabled || !value} aria-label="清空全部数字" onClick={() => onChange('')}><RotateCcw size={23} aria-hidden="true" /><span>重来</span></button>
      <button type="button" disabled={disabled || value.length === 6} onClick={() => onChange(value + '0')}>0</button>
      <button className="keypad-edit" type="button" disabled={disabled || !value} aria-label="删除最后一个数字" onClick={() => onChange(value.slice(0, -1))}><Delete size={27} aria-hidden="true" /><span>退一格</span></button>
    </div>
  </div>;
}
