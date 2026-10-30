import { Button } from "@/components/ui/button";
import { ShieldAlert, Flame } from "lucide-react";
import Link from "next/link";


export default function Home() {
  return (
    <div className="bg-[url('/background.jpg')] bg-center min-h-screen font-sans flex flex-col crawl-container text-yellow-300">
      <section className="animate-crawl flex-1 flex flex-col justify-center items-center px-2 sm:px-6 crawl-text">
        <div className="w-full max-w-3xl text-center mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-6 leading-tight">
            Welcome to{" "}
            <span className="text-red-500 drop-shadow-lg">ClauseVader</span>
          </h1>
          <p className="md:text-4xl text-md sm:text-lg  mb-8 leading-relaxed">
            The Dark Side of contract analysis. Uncover red flags. Rewrite with
            precision. Dominate the legal galaxy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href ="/dashboard">
              <Button className="bg-yellow-400 hover:bg-red-700 transition-all duration-300 text-white text-base sm:text-lg px-2 py-4 shadow-md shadow-red-500/30">
                <Flame className="mr-2 h-5 w-5 text-black" /><span className="text-black">Enter the Dark Side</span>
              </Button>
            </Link>
            <Link href="/about">
            <Button
              variant="outline"
              className="border-yellow-300 bg-transparent text-yellow-300 hover:bg-red-700 hover:border-red-700 transition-all duration-300 text-base sm:text-lg px-2 py-4"
            >
              <ShieldAlert className="mr-2 h-5 w-5" /> Learn More
            </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-transparent text-center py-4 border-t border-red-900 text-sm text-red-500">
        &copy; {new Date().getFullYear()} ClauseVader. Forged in the shadows of Coruscant.
      </footer>
    </div>
  );
}
