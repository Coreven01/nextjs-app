import { JSX } from "react";

type OrientationType = {
  src: JSX.Element,
  element: JSX.Element,
  orientation: "left" | "right"
};

export default function HomeDescription({orientation, src, element}: OrientationType) {
  return (
    <div className="flex flex-col md:flex-row bg-zinc-200 dark:bg-neutral-900 dark:text-white border m-4">
      {orientation === "left" ? 
        <>
          <div className="flex-grow md:min-w-80">
            {src}
          </div>
          {element}
        </>  
      :
      <>
          {element}
          <div className="flex-grow md:min-w-80">
            {src}
          </div>
        </>
    }
    </div>
  );
}