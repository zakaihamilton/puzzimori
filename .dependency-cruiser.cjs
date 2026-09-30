module.exports = {
  forbidden: [
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    {
      name: "engine-is-independent",
      severity: "error",
      from: { path: "^src/engine/" },
      to: {
        path: "^(src/(app|components|game|storage|i18n)/|node_modules/(react|react-dom|next)(/|$))",
      },
    },
    { name: "no-unresolved", severity: "error", from: {}, to: { couldNotResolve: true } },
  ],
  options: {
    tsConfig: { fileName: "tsconfig.json" },
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.test\\.ts$" },
  },
};
