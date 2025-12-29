const t = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <mask id="cut-out">
    <rect width="24" height="24" fill="white"></rect>
    <path stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M15 9l-6 6m0-6l6 6"></path>
  </mask>
  <circle cx="12" cy="12" r="10" mask="url(#cut-out)"></circle>
</svg>
`;
export {
  t as DELETE_SVG
};
