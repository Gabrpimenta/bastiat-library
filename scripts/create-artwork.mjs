import sharp from 'sharp';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import path from 'node:path';

const target = path.resolve('apps/web/public/artwork');
await mkdir(target, { recursive: true });
await mkdir('apps/mobile/assets', { recursive: true });
const frame = (body, color = '#25383B') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#111F24"/></linearGradient><linearGradient id="light" x2=".6" y2="1"><stop stop-color="#E9C7A0"/><stop offset="1" stop-color="#956D50"/></linearGradient><linearGradient id="stone" x2="1" y2=".7"><stop stop-color="#C2B49D"/><stop offset="1" stop-color="#706D61"/></linearGradient><pattern id="grain" width="12" height="12" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".6" fill="#F1D7B4" opacity=".12"/></pattern></defs><rect width="1600" height="1100" fill="url(#bg)"/>${body}<rect width="1600" height="1100" fill="url(#grain)"/><path d="M70 70h80M70 70v80M1530 1030h-80M1530 1030v-80" fill="none" stroke="#DFC3A0" opacity=".4" stroke-width="2"/></svg>`;
const art = {
  window: frame(
    `<circle cx="1160" cy="250" r="170" fill="#D9AB77" opacity=".08"/><path d="M430 990V400a370 370 0 0 1 740 0v590" fill="#16292C" stroke="#66716A" stroke-width="28"/><path d="M475 990V400a325 325 0 0 1 650 0v590" fill="url(#light)"/><path d="M480 990 1040 580l85 410" fill="#EFD6B0" opacity=".65"/><path d="M475 610h650M800 90v900" stroke="#2E3B38" stroke-width="28"/><path d="m795 610 105-150-40-88 95-50-42-78m-110 373-92 116 16 94-143 96m214-303 185 25 139-81" fill="none" stroke="#F7E8CE" stroke-width="7"/><path d="m430 990-270 110h1230l-220-110" fill="#213033"/><path d="m830 632 90 152-152-18Z" fill="#EBE2CF" opacity=".6"/><path d="M650 1025h260" stroke="#8B8271" stroke-width="6"/>`,
  ),
  law: frame(
    `<circle cx="800" cy="480" r="365" fill="#D4BE9D" opacity=".08"/><path d="M365 945h870v55H365zM415 880h770v65H415z" fill="url(#stone)"/><path d="M495 410h610v65H495zM455 365l345-185 345 185Z" fill="url(#stone)"/><path d="M535 465h100v415H535zm215 0h100v415H750zm215 0h100v415H965z" fill="url(#stone)"/><path d="M550 480v380m28-380v380m28-380v380m160-380v380m28-380v380m28-380v380m160-380v380m28-380v380m28-380v380" stroke="#4A514B" opacity=".4" stroke-width="9"/>`,
    '#423831',
  ),
  trade: frame(
    `<circle cx="1140" cy="340" r="165" fill="#D9BB8B"/><path d="M0 730 240 650l190 40 270-65 380 80 290-15 230 85v325H0" fill="#345356"/><path d="m520 754 600 0-115 136H650Z" fill="#142529"/><path d="M820 245v535" stroke="#C7AC85" stroke-width="12"/><path d="m802 290-250 425h250Z" fill="#DCCBB0"/><path d="m845 360 240 365H845Z" fill="#B4B9A8"/><path d="M190 920h310m430 55h410M260 1010h420m390-175h315" stroke="#85958B" stroke-width="5" opacity=".5"/>`,
    '#243E42',
  ),
  choice: frame(
    `<circle cx="780" cy="510" r="360" stroke="#8F9C88" opacity=".25" fill="none" stroke-width="2"/><circle cx="780" cy="510" r="285" stroke="#8F9C88" opacity=".25" fill="none" stroke-width="2"/><path d="M765 1030V665L450 345M785 675l365-405" fill="none" stroke="#D6B385" stroke-width="72"/><path d="M765 1030V665L450 345" fill="none" stroke="#E9CFAB" stroke-width="3"/><path d="m344 320 108-74 110 98-115 67Z" fill="#E5C6A2"/><path d="m1047 270 105-96 124 100-119 80Z" fill="#AFBDA8"/><path d="M740 1025h70" stroke="#142529" stroke-width="20"/>`,
    '#2D3934',
  ),
};
for (const [name, svg] of Object.entries(art)) {
  await writeFile(path.join(target, `${name}.svg`), svg);
  await sharp(Buffer.from(svg))
    .webp({ quality: 90 })
    .toFile(path.join(target, `${name}.webp`));
  await sharp(Buffer.from(svg))
    .resize(1280, 880)
    .png()
    .toFile(path.join(target, `${name}.png`));
  await copyFile(path.join(target, `${name}.webp`), `apps/mobile/assets/${name}.webp`);
}
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" rx="220" fill="#152329"/><path d="M275 690V345q110-40 237 40 127-80 237-40v345q-120-40-237 40-117-80-237-40Z" fill="none" stroke="#E2AE85" stroke-width="30" stroke-linejoin="round"/><path d="M512 385v345M350 440q70-5 105 25m-105 60q70-5 105 25m114-85q35-30 105-25m-105 110q35-30 105-25" fill="none" stroke="#E2AE85" stroke-width="22" stroke-linecap="round"/></svg>`;
await sharp(Buffer.from(icon)).png().toFile('apps/mobile/assets/icon.png');
await copyFile('apps/mobile/assets/icon.png', 'apps/web/public/icon.png');
console.log('Original artwork and app icons generated.');
