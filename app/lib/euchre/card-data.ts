import { Card } from "./data";

const baseCard: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="100"
   height="150"
   version="1.1"
   id="svg4"
   sodipodi:docname="card-base.svg"
   inkscape:version="1.4 (86a8ad7, 2024-10-11)"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <defs
     id="defs4" />
  <sodipodi:namedview
     id="namedview4"
     pagecolor="#ffffff"
     bordercolor="#000000"
     borderopacity="0.25"
     inkscape:showpageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="0"
     inkscape:deskcolor="#d1d1d1"
     inkscape:zoom="7.94"
     inkscape:cx="49.874055"
     inkscape:cy="72.229219"
     inkscape:window-width="2560"
     inkscape:window-height="1472"
     inkscape:window-x="-11"
     inkscape:window-y="-11"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg4"
     showgrid="false" />
  <rect
     width="97.771812"
     height="147.51994"
     rx="7"
     fill="#ffffff"
     stroke="#000000"
     stroke-width="1.96118"
     id="rect1"
     x="1.2400337"
     y="1.3659784" />`;

type TextData = {
   x: number,
   y: number,
   fontsize: string,
   transform: string
   style: string
}

const centerSvgVals = new Map<string, TextData>(
   [
      ["s1-1", { x: 21.09375, y: 42.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s1-2", { x: 21.09375, y: 71.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s1-3", { x: 21.09375, y: 84.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s1-4", { x: -38.09375, y: -82, fontsize: "32px", transform: "scale(-1)", style: "display:inline" }],
      ["s1-5", { x: -38.09375, y: -110, fontsize: "32px", transform: "scale(-1)", style: "display:inline" }],
      ["s2-1", { x: 43.09375, y: 42.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s2-2", { x: 43.09375, y: 59.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s2-3", { x: 43.118938, y: 86.798607, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s2-4", { x: -60.09375, y: -93, fontsize: "32px", transform: "scale(-1)", style: "display:inline" }],
      ["s2-5", { x: -60.09375, y: -110, fontsize: "32px", transform: "scale(-1)", style: "display:inline" }],
      ["s2-b", { x: 30.931087, y: 99.539062, fontsize: "72px", transform: "", style: "display:inline" }],
      ["s3-1", { x: 65.09375, y: 42.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s3-2", { x: 65.09375, y: 71.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s3-3", { x: 65.09375, y: 84.234375, fontsize: "32px", transform: "", style: "display:inline" }],
      ["s3-4", { x: -82.09375, y: -82, fontsize: "32px", transform: "scale(-1)", style: "display:inline" }],
      ["s3-5", { x: -82.09375, y: -110, fontsize: "32px", transform: "scale(-1)", style: "display:inline" }],
   ]
);

const sideSvgVals = new Map<string, TextData>(
   [
      ["s1-1", { x: 22.598301, y: 33.860966, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s3-2", { x: 69.30864, y: 51.879185, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s1-2", { x: 22.598301, y: 52.126293, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s3-6", { x: -87.5177, y: -88.442505, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-4", { x: 46.144886, y: 79.056786, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-2", { x: 46.144886, y: 52.53109, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-3", { x: 46.144886, y: 63.469906, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-5", { x: -63.933369, y: -73.728767, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-7", { x: -63.933369, y: -104.54948, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-1", { x: 46.144886, y: 33.860966, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s1-4", { x: 22.598301, y: 78.546082, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s1-3", { x: 22.598301, y: 62.959206, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s1-5", { x: -40.386784, y: -73.218063, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s1-7", { x: -40.386784, y: -104.03879, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s-b", { x: -96.953743, y: -119.16161, fontsize: "17.8577px", transform: "scale(-0.97918076,-1.0212619)", style: "stroke-width:0.51022" }],
      ["v-b", { x: -94.352135, y: -134.91064, fontsize: "16.7383px", transform: "scale(-1.0040591,-0.99595731)", style: "stroke-width:0.836917" }],
      ["v-t", { x: 3.0543571, y: 18.051723, fontsize: "16.7383px", transform: "scale(1.0646857,0.93924431)", style: "stroke-width:0.836917" }],
      ["s-t", { x: 3.8648531, y: 29.276762, fontsize: "17.8577px", transform: "scale(0.97918076,1.0212619)", style: "stroke-width:0.51022" }],
      ["s3-4", { x: 69.30056, y: 78.021263, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s3-3", { x: 69.30056, y: 62.434391, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s3-5", { x: -87.089043, y: -72.693245, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s3-7", { x: -87.089043, y: -103.51397, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s3-1", { x: 69.691467, y: 33.860966, fontsize: "33.4842px", transform: "scale(0.93431809,1.0702993)", style: "stroke-width:0.956693" }],
      ["s2-6", { x: -63.933369, y: -88.934372, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
      ["s1-6", { x: -40.386784, y: -88.892014, fontsize: "33.4842px", transform: "scale(-0.93431809,-1.0702993)", style: "stroke-width:0.956693" }],
   ]
);

const cardSvgValues: Map<string, string[]> = new Map([
   ["2", ["s2-1", "s2-5"]],
   ["3", ["s2-1", "s2-5", "s2-3"]],
   ["4", ["s1-1", "s3-1", "s1-5", "s3-5"]],
   ["5", ["s1-1", "s3-1", "s1-5", "s3-5", "s2-3"]],
   ["6", ["s1-1", "s3-1", "s1-5", "s3-5", "s1-3", "s3-3"]],
   ["7", ["s1-1", "s3-1", "s1-5", "s3-5", "s1-3", "s3-3", "s2-2"]],
   ["8", ["s1-1", "s3-1", "s1-5", "s3-5", "s1-3", "s3-3", "s2-2", "s2-4"]],
   ["9", ["s1-1", "s3-1", "s1-2", "s3-2", "s1-4", "s1-5", "s2-3", "s3-4", "s3-5"]],
   ["10", ["s1-1", "s3-1", "s1-2", "s3-2", "s1-4", "s1-5", "s2-2", "s3-4", "s3-5", "s2-4"]],
   ["J", ["s2-b"]],
   ["Q", ["s2-b"]],
   ["K", ["s2-b"]],
   ["A", ["s2-b"]],
]);

const svgCenterCardValues: Map<string, TextData> = new Map([
   ["s-b", { x: -93.46167, y: -118.71033, fontsize: "14px", transform: "scale(-1)", style: "display:inline" }],
   ["s-t", { x: 6.3028178, y: 33.939663, fontsize: "14px", transform: "", style: "display:inline" }],
   ["v-b", { x: -109.70619, y: -112.38538, fontsize: "20px", transform: "scale(-0.865,-1.155)", style: "display:inline;stroke-width:0.86509" }],
   ["v-t", { x: 5.433156, y: 18.29949, fontsize: "20px", transform: "scale(0.865,1.155)", style: "display:inline;stroke-width:0.86509" }],
])

const svgCardColors = new Map<string, string>([
   ["R", "#EF4444"],
   ["B", "#000"],
])

/** Get dynamic svg for a playing card.
 * 
 * @param card 
 * @param location 
 * @returns 
 */
function getCardSvg(card: Card, location: "center" | "side"): string {

   let retval = baseCard;
   const textValues = [];
   const imageKeys = cardSvgValues.get(card.value.value) ?? [];
   const imageColor = svgCardColors.get(card.suit.color) ?? "#000";

   for (const text of imageKeys) {
      let imageLocation: TextData | undefined;
      imageLocation = location ? centerSvgVals.get(text) : centerSvgVals.get(text);

      if (imageLocation) {
         const xml = getCardText(imageLocation, imageColor, card.suit.suit);
         textValues.push(xml);
      }
   }

   for (const imageLocation of svgCenterCardValues) {
      if (imageLocation) {
         const xml = getCardText(imageLocation[1], imageColor, imageLocation[0].charAt(0) === "s" ? card.suit.suit : card.value.value);
         textValues.push(xml);
      }
   }

   for (const val of textValues)
      retval += val;

   retval += '</svg>';

   return retval;
}

export function getEncodedCardSvg(card: Card, location: "center" | "side") {

   const cardSvg = getCardSvg(card, location);
   const dynamicSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(cardSvg)}`;

   return dynamicSvg;
}

/** Get text element for svg for a card value.
 * 
 * @param text 
 * @param color 
 * @param displayValue 
 * @returns 
 */
function getCardText(text: TextData, color: string, displayValue: string): string {

   return `
         <text
            x="${text.x}"
            y="${text.y}"
            font-family="Arial"
            font-size="${text.fontsize}"
            fill="${color}"
            id="${text}"
            transform="${text.transform}"
            style="${text.style}">${displayValue}</text>
         `;
}