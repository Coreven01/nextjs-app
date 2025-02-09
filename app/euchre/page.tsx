import { Metadata } from "next";
import EuchreGame from "../ui/euchre/game";

export const metadata: Metadata = {
    title: 'Nolan Appel | Phaser Example',
  };
  
export default function Euchre() {
    
    return <EuchreGame />
}