/** @type {import("prettier").Config} */
module.exports = {
  // i am just using the standard config, change if you need something else
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ...require('prettier-config-standard'),
  plugins: [require.resolve('prettier-plugin-tailwindcss')]
}
