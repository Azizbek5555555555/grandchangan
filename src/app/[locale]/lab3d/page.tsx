// VAQTINCHALIK — 3D sahnalarni ko'rish uchun (three agenti o'chiradi)
import HeroBowl from "@/components/three/HeroBowl";

export default function Lab3D() {
  return (
    <main>
      <section className="relative bg-fire" style={{ height: "100vh" }} data-lab="hero">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[60%]">
          <HeroBowl className="h-full w-full" />
        </div>
      </section>
      <section className="bg-wine" style={{ height: "100vh" }} data-lab="dimsum" />
      <section className="bg-night" style={{ height: "100vh" }} data-lab="lanterns" />
    </main>
  );
}
