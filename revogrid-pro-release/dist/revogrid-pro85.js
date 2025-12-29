import { parseBoolean as i } from "./revogrid-pro86.js";
function a(t) {
  return typeof t == "number" && !Number.isNaN(t);
}
function o(t) {
  return typeof i(t) == "boolean";
}
function c(t) {
  return typeof t == "string";
}
function N(t) {
  const n = Number(t);
  return Number.isInteger(n);
}
function f(t) {
  const n = Number(t);
  return !Number.isNaN(n) && !Number.isInteger(n);
}
function m(t, n, r) {
  const e = Number(t);
  return !Number.isNaN(e) && e >= n && e <= r;
}
function l(t) {
  return Array.isArray(t);
}
function s(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function d(t) {
  return t === null;
}
function b(t) {
  return t === void 0;
}
function v(t) {
  return Object.prototype.toString.call(t) === "[object Date]" && !isNaN(t.getTime());
}
function g(t, n) {
  return typeof t == "string" && n.test(t);
}
function y(t, n) {
  return n.includes(t);
}
function p(t) {
  const n = Number(t);
  return !Number.isNaN(n) && n > 0;
}
function A(t) {
  const n = Number(t);
  return !Number.isNaN(n) && n < 0;
}
function j(t) {
  return Number.isFinite(t);
}
function I(t) {
  return t === "";
}
function S(t) {
  return typeof t == "string" && t.trim().length > 0;
}
function D(t, n) {
  return t instanceof n;
}
export {
  l as validateArray,
  o as validateBoolean,
  v as validateDate,
  f as validateDecimal,
  I as validateEmptyString,
  y as validateEnum,
  j as validateFinite,
  D as validateInstance,
  N as validateInteger,
  A as validateNegative,
  S as validateNonEmptyString,
  d as validateNull,
  a as validateNumber,
  s as validateObject,
  p as validatePositive,
  m as validateRange,
  g as validateRegex,
  c as validateString,
  b as validateUndefined
};
