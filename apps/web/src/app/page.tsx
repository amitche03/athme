import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-6xl font-extrabold text-white tracking-tight">
          Athme
        </h1>
        <p className="text-[#888] mt-4 text-lg">
          Train for what moves you
        </p>
        <p className="text-[#555] mt-2 text-sm">
          Sport-specific fitness planning for multisport athletes
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-10 justify-center">
          <Link
            href="/sign-in"
            className="bg-[#22C55E] text-black font-bold px-8 py-3.5 rounded-xl hover:bg-[#16A34A] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="bg-[#1A1A1A] text-white font-semibold px-8 py-3.5 rounded-xl border border-[#2A2A2A] hover:border-[#444] transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
