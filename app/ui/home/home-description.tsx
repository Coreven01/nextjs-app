import { JSX } from "react";

type OrientationType = {
  src: JSX.Element,
  element: JSX.Element,
  orientation: "left" | "right"
};

export const SECTION_STYLE = "shadow-custom-black dark:shadow-custom-gray bg-zinc-200 dark:bg-neutral-900 dark:text-white border border-black dark:border-white";

export default function HomeDescription({orientation, src, element}: OrientationType) {
  return (
    <div className={`flex flex-col md:flex-row md:m-4 mx-2 my-4 ${SECTION_STYLE}`}>
      {orientation === "left" ? 
        <>
          <div className="flex-grow md:min-w-80 m-auto">
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