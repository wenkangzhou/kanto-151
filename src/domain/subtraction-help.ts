export type HelpStep = { title: string; equation: string; speech: string; groups: { total: number; removed: number; label: string }[] };

/** Match the drawing to each arithmetic step, retaining the untouched group. */
export function subtractionHelp(a: number, b: number): HelpStep[] {
  const units = a - 10;
  if (a >= 10 && b < 10 && b > a % 10) {
    const left = 10 - b;
    return [
      { title: '先拆出一个十', equation: `${a} = 10 + ${units}`, speech: `${a}可以拆成十和${units}。先把${units}放在旁边。`, groups: [{ total: 10, removed: 0, label: '10' }, { total: units, removed: 0, label: String(units) }] },
      { title: '从十里面减', equation: `10 − ${b} = ${left}`, speech: `十减${b}等于${left}。旁边的${units}还在。`, groups: [{ total: 10, removed: b, label: `剩 ${left}` }, { total: units, removed: 0, label: String(units) }] },
      { title: '把剩下的合起来', equation: `${left} + ${units} = ${a-b}`, speech: `再把${left}和${units}加起来，等于${a-b}。`, groups: [{ total: left, removed: 0, label: String(left) }, { total: units, removed: 0, label: String(units) }] },
    ];
  }
  if (b >= 10) {
    const removeUnits = b - 10;
    return [
      { title: '两个数都拆出十', equation: `${a} = 10 + ${units}；${b} = 10 + ${removeUnits}`, speech: `${a}拆成十和${units}，${b}拆成十和${removeUnits}。`, groups: [{ total: 10, removed: 0, label: '10' }, { total: units, removed: 0, label: String(units) }] },
      { title: '先减掉一个十', equation: `${a} − 10 = ${units}`, speech: `先从${a}里面减去十，剩下${units}。还要减去${removeUnits}。`, groups: [{ total: 10, removed: 10, label: '减去 10' }, { total: units, removed: 0, label: String(units) }] },
      { title: '再减掉剩下的', equation: `${units} − ${removeUnits} = ${a-b}`, speech: `${units}再减${removeUnits}，等于${a-b}。`, groups: [{ total: units, removed: removeUnits, label: `剩 ${a-b}` }] },
    ];
  }
  return [
    { title: '先摆出来', equation: `${a} − ${b}`, speech: `摆好${a}个，准备拿走${b}个。`, groups: [{ total: Math.min(a,10), removed: 0, label: String(Math.min(a,10)) }, ...(a>10?[{ total: units, removed: 0, label: String(units) }]:[])] },
    { title: '拿走后数一数', equation: `${a} − ${b} = ${a-b}`, speech: `拿走${b}个，还剩${a-b}个。`, groups: a>=10?[{ total: 10, removed: 0, label: '10' }, { total: units, removed: b, label: `剩 ${units-b}` }]:[{total:a,removed:b,label:`剩 ${a-b}`}] },
  ];
}
