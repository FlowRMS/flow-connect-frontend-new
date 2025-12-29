/* empty css                */
const c = (r, { value: a, column: e }) => r("img", { class: {
  "avatar-cell": !0,
  rectangular: e?.rectangular
}, src: a });
export {
  c as avatarRenderer
};
