// SPDX license-expression check used by the license gate.
/**
 * SPDX expression evaluator with real precedence (AND binds tighter than OR, parentheses
 * group). An identifier is allowed only if it is in `allow`; `WITH` exceptions and anything
 * that is not a valid expression ("SEE LICENSE IN …", "UNKNOWN") fail closed.
 */
export function spdxAllowed(expr, allow) {
  const tokens = String(expr).match(/\(|\)|[^\s()]+/g) ?? [];
  let i = 0;
  const peek = () => tokens[i];
  function factor() {
    const t = tokens[i++];
    if (t === '(') {
      const v = orExpr();
      if (tokens[i++] !== ')') throw new Error('paren');
      return v;
    }
    if (!t || t === ')' || /^(AND|OR|WITH)$/i.test(t)) throw new Error('token');
    if (/^WITH$/i.test(peek() ?? '')) {
      i += 2;
      return false;
    }
    return allow.has(t);
  }
  function andExpr() {
    let v = factor();
    while (/^AND$/i.test(peek() ?? '')) {
      i++;
      v = factor() && v;
    }
    return v;
  }
  function orExpr() {
    let v = andExpr();
    while (/^OR$/i.test(peek() ?? '')) {
      i++;
      v = andExpr() || v;
    }
    return v;
  }
  try {
    const v = orExpr();
    return i === tokens.length && v;
  } catch {
    return false;
  }
}
