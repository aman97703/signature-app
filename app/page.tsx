import Board from "@/components/board";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <h1 className="text-4xl font-bold mb-8">Whiteboard</h1>
      <Board/>
    </main>
  );
}
