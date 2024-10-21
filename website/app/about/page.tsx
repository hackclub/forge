import { title } from "@/components/primitives";

export default function AboutPage() {
  return (
    <div>
      <h1 className={title()}>Forge</h1><br/>
        <h2>Forge is an open-source, hackable 3D printer & OpenSCAD-based editor made by teens at Hack Club. If you’re a high schooler (or younger), you can get one for free!</h2>
    </div>
  );
}
