const g = {
  sum: (e) => e?.reduce((r, t) => r + Number(t), 0),
  count: (e) => e.length,
  /**
   * Computes the average (mean).
   */
  avg: (e) => e.length ? e.reduce((r, t) => r + Number(t), 0) / e.length : 0,
  /**
   * Computes the minimum value.
   */
  min: (e) => e.length ? Math.min(...e.map(Number)) : 0,
  /**
   * Computes the maximum value.
   */
  max: (e) => e.length ? Math.max(...e.map(Number)) : 0,
  /**
   * Finds the middle value of a sorted list.
   */
  median: (e) => {
    const r = e.map(Number).sort((n, m) => n - m), t = Math.floor(r.length / 2);
    return r.length % 2 !== 0 ? r[t] : (r[t - 1] + r[t]) / 2;
  },
  /**
   * Returns the most frequently occurring value.
   */
  mode: (e) => {
    if (!e.length) return 0;
    const r = e.reduce(
      (t, n) => {
        const m = Number(n);
        return t[m] = (t[m] || 0) + 1, t;
      },
      {}
    );
    return Object.keys(r).reduce(
      (t, n) => r[Number(t)] > r[Number(n)] ? t : n
    );
  },
  /**
   * Difference between max and min.
   */
  range: (e) => e.length ? Math.max(...e.map(Number)) - Math.min(...e.map(Number)) : 0,
  /**
   * Measures spread of data.
   */
  variance: (e) => {
    const r = e.reduce((t, n) => t + Number(n), 0) / e.length;
    return e.reduce((t, n) => t + Math.pow(Number(n) - r, 2), 0) / e.length;
  },
  /**
   * Square root of variance (standard deviation).
   */
  stdDev: (e) => Math.sqrt(g.variance(e)),
  /**
   * Returns the first value.
   */
  first: (e) => e.length ? e[0] : "",
  /**
   * Returns the last value.
   */
  last: (e) => e.length ? e[e.length - 1] : "",
  /**
   * Counts the number of unique values.
   */
  distinct: (e) => [...new Set(e.map(Number))].length
}, h = {
  /**
   * Returns a list where each value represents its percentage of the total sum.
   */
  "%oftotal": (e) => {
    const r = e.reduce((t, n) => t + Number(n), 0);
    return e.map((t) => Number(t) / r * 100);
  },
  /**
   *  Creates an accumulating sum list.
   */
  accSum: (e) => e.reduce((r, t, n) => (r.push((r[n - 1] || 0) + Number(t)), r), [])
};
export {
  h as advancedAggregators,
  g as commonAggregators
};
