import type {EncyclopediaBall} from '@/domain/encyclopedia';
// Local vector illustrations remain crisp on tablets and need no network image request.
export function BallArt({ball}:{ball:EncyclopediaBall}){
 const top=ball.id==='ultra'?'#353a42':ball.color;
 return <svg className="encyclopedia-ball" viewBox="0 0 200 200" role="img" aria-label={ball.name}>
  <ellipse cx="100" cy="179" rx="59" ry="9" fill="#29333a" opacity=".08"/>
  <path d="M24 100a76 76 0 0 1 152 0Z" fill={top}/><path d="M24 100a76 76 0 0 0 152 0Z" fill="#fffdf5"/>
  {ball.id==='great'&&<><path d="M49 43l19-12 15 51-23 7Z" fill="#ef5555"/><path d="M151 43l-19-12-15 51 23 7Z" fill="#ef5555"/></>}
  {ball.id==='ultra'&&<path d="M51 46l19-12v38h60V34l19 12v49h-19V87H70v8H51Z" fill="#f2cf52"/>}
  {ball.id==='master'&&<><ellipse cx="49" cy="62" rx="16" ry="21" transform="rotate(30 49 62)" fill="#ec91ba"/><ellipse cx="151" cy="62" rx="16" ry="21" transform="rotate(-30 151 62)" fill="#ec91ba"/><path d="M85 78V49l15 18 15-18v29" fill="none" stroke="white" strokeWidth="7" strokeLinejoin="round"/></>}
  {ball.id==='safari'&&<><path d="M44 53l21-13 14 16-10 18-29-3Z M118 33l23 11-7 21-24-5Z M137 77l22-13 12 22-21 10Z" fill="#536c44"/><path d="M81 29l21-4 8 17-19 10Z M75 77l23-15 16 22-20 14Z" fill="#d5c494"/></>}
  <circle cx="100" cy="100" r="76" fill="none" stroke="#343e43" strokeWidth="6"/><path d="M25 100h150" stroke="#343e43" strokeWidth="9"/>
  <circle cx="100" cy="100" r="23" fill="#fffdf5" stroke="#343e43" strokeWidth="7"/><circle cx="100" cy="100" r="12" fill="#f4f5ee" stroke="#cbd3cc" strokeWidth="3"/>
  <path d="M42 72q8-22 27-29" fill="none" stroke="white" strokeWidth="8" opacity=".3" strokeLinecap="round"/>
 </svg>;
}
