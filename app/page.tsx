
import HomeDescription from "./ui/home/home-description";
import Image from "next/image";

export default function Home() {

  return (
    <>
      <HomeDescription orientation={"left"} src={GetSectionSelfImage()} element={GetSectionSelfDescription()} />
      <HomeDescription orientation={"right"} src={GetSectionSelfImage()} element={GetSectionSelfDescription()} />
      <HomeDescription orientation={"left"} src={GetSectionSelfImage()} element={GetSectionSelfDescription()} />
      <HomeDescription orientation={"right"} src={GetSectionSelfImage()} element={GetSectionSelfDescription()} />
    </> 
  );
}

function GetSectionSelfImage()
{
  return (<Image className="md:border-r contain" quality={100} src={"/photo.png"} width={600} height={748} alt="Photo" />);
}

function GetSectionSelfDescription()
{

  return (<div className="flex-grow p-2">
    Hello and welcome! .NET developer here seeking work in the west Michigan area.
    Technology has been my passion for more than 15 years, and I have been working in software development for the last 10 years.
    I've worked in several different positions within IT including technical support, server administration, report writing, and application development.
    <br /><br />
    While I prefer and focus on back-end code, I am capable of full-stack development.
    Experienced in engineering, maintaining, and testing code using .NET framework and .NET core. 
    I've honed my skills over the years by using best practices, test-driven design, and SOLID principles.
    <br /><br />
    I can be reached at LinkedIn: <a className="underline text-black hover:text-blue-500 dark:text-yellow-200 dark:hover:text-red-200" href="https://www.linkedin.com/in/nolanappel/">Nolan Appel - LinkedIn</a>
  </div>);

}