import { CardValue } from "./data";


export const baseCard: string = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
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
     inkscape:cx="49.937028"
     inkscape:cy="54.848866"
     inkscape:window-width="2560"
     inkscape:window-height="1472"
     inkscape:window-x="-11"
     inkscape:window-y="-11"
     inkscape:window-maximized="1"
     inkscape:current-layer="svg4" />
  <rect
     width="100"
     height="150"
     rx="10"
     fill="#ffffff"
     stroke="#000000"
     stroke-width="2"
     id="rect1"
     x="0.12594458"
     y="-1.0075567" />`;


     type TextData = {
        x: number,
        y: number, 
        fontsize:number,
        fill: string,
        id: string,
        transform: string
        style: string
        text: string
     }

     export const cardSvgValues: TextData[] = [
        { x: 1, y: 2, fontsize:1, fill:'', id: '', transform: '', style: '', text: '' }
    ]

    export function getCardSvg(card: CardValue) : string {

        const retval = '';
        const textValues = [];


        return '';
    }
