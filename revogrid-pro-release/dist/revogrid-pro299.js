import { __exports as k } from "./revogrid-pro300.js";
var w;
function X() {
  return w ? k : (w = 1, (function(B) {
    (function(E) {
      E(typeof DO_NOT_EXPORT_BESSEL > "u" ? B : {});
    })(function(E) {
      E.version = "1.0.2";
      var r = Math;
      function v(b, o) {
        for (var l = 0, u = 0; l < b.length; ++l) u = o * u + b[l];
        return u;
      }
      function R(b, o, l, u, q) {
        if (o === 0) return l;
        if (o === 1) return u;
        for (var y = 2 / b, e = u, f = 1; f < o; ++f)
          e = u * f * y + q * l, l = u, u = e;
        return e;
      }
      function T(b, o, l, u, q) {
        return function(e, f) {
          if (u) {
            if (e === 0) return u == 1 ? -1 / 0 : 1 / 0;
            if (e < 0) return NaN;
          }
          if (f === 0) return b(e);
          if (f === 1) return o(e);
          if (f < 0) return NaN;
          f |= 0;
          var _ = b(e), N = o(e);
          return R(e, f, _, N, q);
        };
      }
      var I = (function() {
        var b = 0.636619772, o = [57568490574, -13362590354, 6516196407e-1, -1121442418e-2, 77392.33017, -184.9052456].reverse(), l = [57568490411, 1029532985, 9494680718e-3, 59272.64853, 267.8532712, 1].reverse(), u = [1, -0.001098628627, 2734510407e-14, -2073370639e-15, 2093887211e-16].reverse(), q = [-0.01562499995, 1430488765e-13, -6911147651e-15, 7621095161e-16, -934935152e-16].reverse();
        function y(s) {
          var t = 0, a = 0, n = 0, i = s * s;
          if (s < 8)
            a = v(o, i), n = v(l, i), t = a / n;
          else {
            var c = s - 0.785398164;
            i = 64 / i, a = v(u, i), n = v(q, i), t = r.sqrt(b / s) * (r.cos(c) * a - r.sin(c) * n * 8 / s);
          }
          return t;
        }
        var e = [72362614232, -7895059235, 2423968531e-1, -2972611439e-3, 15704.4826, -30.16036606].reverse(), f = [144725228442, 2300535178, 1858330474e-2, 99447.43394, 376.9991397, 1].reverse(), _ = [1, 183105e-8, -3516396496e-14, 2457520174e-15, -240337019e-15].reverse(), N = [0.04687499995, -2002690873e-13, 8449199096e-15, -88228987e-14, 105787412e-15].reverse();
        function d(s) {
          var t = 0, a = 0, n = 0, i = s * s, c = r.abs(s) - 2.356194491;
          return Math.abs(s) < 8 ? (a = s * v(e, i), n = v(f, i), t = a / n) : (i = 64 / i, a = v(_, i), n = v(N, i), t = r.sqrt(b / r.abs(s)) * (r.cos(c) * a - r.sin(c) * n * 8 / r.abs(s)), s < 0 && (t = -t)), t;
        }
        return function s(t, a) {
          if (a = Math.round(a), !isFinite(t)) return isNaN(t) ? t : 0;
          if (a < 0) return (a % 2 ? -1 : 1) * s(t, -a);
          if (t < 0) return (a % 2 ? -1 : 1) * s(-t, a);
          if (a === 0) return y(t);
          if (a === 1) return d(t);
          if (t === 0) return 0;
          var n = 0;
          if (t > a)
            n = R(t, a, y(t), d(t), -1);
          else {
            for (var i = 2 * r.floor((a + r.floor(r.sqrt(40 * a))) / 2), c = !1, g = 0, p = 0, h = 1, W = 0, K = 2 / t, M = i; M > 0; M--)
              W = M * K * h - g, g = h, h = W, r.abs(h) > 1e10 && (h *= 1e-10, g *= 1e-10, n *= 1e-10, p *= 1e-10), c && (p += h), c = !c, M == a && (n = g);
            p = 2 * p - h, n /= p;
          }
          return n;
        };
      })(), D = (function() {
        var b = 0.636619772, o = [-2957821389, 7062834065, -5123598036e-1, 1087988129e-2, -86327.92757, 228.4622733].reverse(), l = [40076544269, 7452499648e-1, 7189466438e-3, 47447.2647, 226.1030244, 1].reverse(), u = [1, -0.001098628627, 2734510407e-14, -2073370639e-15, 2093887211e-16].reverse(), q = [-0.01562499995, 1430488765e-13, -6911147651e-15, 7621095161e-16, -934945152e-16].reverse();
        function y(s) {
          var t = 0, a = 0, n = 0, i = s * s, c = s - 0.785398164;
          return s < 8 ? (a = v(o, i), n = v(l, i), t = a / n + b * I(s, 0) * r.log(s)) : (i = 64 / i, a = v(u, i), n = v(q, i), t = r.sqrt(b / s) * (r.sin(c) * a + r.cos(c) * n * 8 / s)), t;
        }
        var e = [-4900604943e3, 127527439e4, -51534381390, 7349264551e-1, -4237922726e-3, 8511.937935].reverse(), f = [249958057e5, 424441966400, 3733650367, 2245904002e-2, 102042.605, 354.9632885, 1].reverse(), _ = [1, 183105e-8, -3516396496e-14, 2457520174e-15, -240337019e-15].reverse(), N = [0.04687499995, -2002690873e-13, 8449199096e-15, -88228987e-14, 105787412e-15].reverse();
        function d(s) {
          var t = 0, a = 0, n = 0, i = s * s, c = s - 2.356194491;
          return s < 8 ? (a = s * v(e, i), n = v(f, i), t = a / n + b * (I(s, 1) * r.log(s) - 1 / s)) : (i = 64 / i, a = v(_, i), n = v(N, i), t = r.sqrt(b / s) * (r.sin(c) * a + r.cos(c) * n * 8 / s)), t;
        }
        return T(y, d, "BESSELY", 1, -1);
      })(), O = (function() {
        var b = [1, 3.5156229, 3.0899424, 1.2067492, 0.2659732, 0.0360768, 45813e-7].reverse(), o = [0.39894228, 0.01328592, 225319e-8, -157565e-8, 916281e-8, -0.02057706, 0.02635537, -0.01647633, 392377e-8].reverse();
        function l(e) {
          return e <= 3.75 ? v(b, e * e / (3.75 * 3.75)) : r.exp(r.abs(e)) / r.sqrt(r.abs(e)) * v(o, 3.75 / r.abs(e));
        }
        var u = [0.5, 0.87890594, 0.51498869, 0.15084934, 0.02658733, 301532e-8, 32411e-8].reverse(), q = [0.39894228, -0.03988024, -362018e-8, 163801e-8, -0.01031555, 0.02282967, -0.02895312, 0.01787654, -420059e-8].reverse();
        function y(e) {
          return e < 3.75 ? e * v(u, e * e / (3.75 * 3.75)) : (e < 0 ? -1 : 1) * r.exp(r.abs(e)) / r.sqrt(r.abs(e)) * v(q, 3.75 / r.abs(e));
        }
        return function e(f, _) {
          if (_ = Math.round(_), _ === 0) return l(f);
          if (_ === 1) return y(f);
          if (_ < 0) return NaN;
          if (r.abs(f) === 0) return 0;
          if (f == 1 / 0) return 1 / 0;
          var N = 0, d, s = 2 / r.abs(f), t = 0, a = 1, n = 0, i = 2 * r.round((_ + r.round(r.sqrt(40 * _))) / 2);
          for (d = i; d > 0; d--)
            n = d * s * a + t, t = a, a = n, r.abs(a) > 1e10 && (a *= 1e-10, t *= 1e-10, N *= 1e-10), d == _ && (N = t);
          return N *= e(f, 0) / a, f < 0 && _ % 2 ? -N : N;
        };
      })(), F = (function() {
        var b = [-0.57721566, 0.4227842, 0.23069756, 0.0348859, 262698e-8, 1075e-7, 74e-7].reverse(), o = [1.25331414, -0.07832358, 0.02189568, -0.01062446, 587872e-8, -25154e-7, 53208e-8].reverse();
        function l(e) {
          return e <= 2 ? -r.log(e / 2) * O(e, 0) + v(b, e * e / 4) : r.exp(-e) / r.sqrt(e) * v(o, 2 / e);
        }
        var u = [1, 0.15443144, -0.67278579, -0.18156897, -0.01919402, -110404e-8, -4686e-8].reverse(), q = [1.25331414, 0.23498619, -0.0365562, 0.01504268, -780353e-8, 325614e-8, -68245e-8].reverse();
        function y(e) {
          return e <= 2 ? r.log(e / 2) * O(e, 1) + 1 / e * v(u, e * e / 4) : r.exp(-e) / r.sqrt(e) * v(q, 2 / e);
        }
        return T(l, y, "BESSELK", 2, 1);
      })();
      E.besselj = I, E.bessely = D, E.besseli = O, E.besselk = F;
    });
  })(k), k);
}
export {
  X as __require
};
