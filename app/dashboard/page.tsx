"use client";

import { useEffect, useState } from "react"; import { useRouter } from "next/navigation"; import { supabase } from "../../lib/supabase";

type User = { id: string; email?: string; user_metadata?: { full_name?: string; }; };

export default function Dashboard() { const router = useRouter();

const [user, setUser] = useState<User | null>(null); const [section, setSection] = useState("Home"); const [loading, setLoading] = useState(true);

useEffect(() => { let mounted = true;

async function checkUser() {
  const { data, error } = await supabase.auth.getUser();

  if (!mounted) return;

  if (error || !data.user) {
    router.replace("/");
    return;
  }

  setUser(data.user);
  setLoading(false);
}

checkUser();

const { data: listener } =
  supabase.auth.onAuthStateChange((event, session) => {
    if (!mounted) return;

    if (event === "SIGNED_OUT" || !session) {
      router.replace("/");
    } else {
      setUser(session.user);
    }
  });

return () => {
  mounted = false;
  listener.subscription.unsubscribe();
};


}, [router]);

async function signOut() { await supabase.auth.signOut(); router.replace("/"); }

const navigation = [ { name: "Home", icon: "⌂" }, { name: "Discover", icon: "⌕" }, { name: "Community", icon: "♧" }, { name: "AI Assistant", icon: "✧" }, { name: "Messages", icon: "✉" }, { name: "My Profile", icon: "◉" }, { name: "Settings", icon: "⚙" }, ];

const descriptions: Record<string, string> = { Home: "Your personal universe starts here.", Discover: "Explore knowledge, ideas and opportunities.", Community: "Connect with people who share your interests.", "AI Assistant": "Meet your intelligent NEXA companion.", Messages: "Your conversations and connections.", "My Profile": "Manage your identity and personal information.", Settings: "Manage your NEXA experience.", };

const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "Explorer";

if (loading) { return ( <div className="min-h-screen bg-white flex items-center justify-center"> <div className="text-center"> <h1 className="text-5xl font-black tracking-widest text-[#E41E26]"> NEXA. </h1> <p className="text-gray-500 mt-3 text-sm"> Preparing your universe... </p> </div> </div> ); }

return ( <main className="min-h-screen bg-[#FFFFFF] text-[#202020] flex" style={{ fontFamily: "'Instagram Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", }}

>

  {/* SIDEBAR */}

  <aside className="w-64 min-h-screen bg-[#E41E26] text-white p-6 hidden md:flex flex-col shrink-0">

    <div className="mb-14">
      <h1 className="text-4xl font-black tracking-tight italic">
        NEXA.
      </h1>

      <p className="text-[10px] tracking-[3px] text-white/75 mt-2">
        CONNECT · LEARN · DISCOVER
      </p>
    </div>

    <p className="text-[10px] uppercase tracking-[3px] text-white/60 mb-5">
      YOUR SPACE
    </p>

    <nav className="flex flex-col gap-2">

      {navigation.map((item) => (
        <button
          key={item.name}
          onClick={() => setSection(item.name)}
          className={`flex items-center gap-4 p-3 rounded-xl text-left transition-all duration-200 ${
            section === item.name
              ? "bg-white text-[#E41E26] font-bold shadow-lg"
              : "text-white hover:bg-white/15"
          }`}
        >
          <span className="text-2xl w-7 text-center">
            {item.icon}
          </span>

          <span className="text-sm">
            {item.name}
          </span>
        </button>
      ))}

    </nav>

    <div className="mt-auto">

      <div className="border-t border-white/25 pt-5 mb-5">
        <p className="text-[10px] text-white/65">
          SIGNED IN AS
        </p>

        <p className="text-sm mt-2 truncate">
          {user?.email}
        </p>
      </div>

      <button
        onClick={signOut}
        className="w-full text-left p-3 rounded-xl hover:bg-white/15 transition text-sm"
      >
        ↗ Sign Out
      </button>

    </div>
  </aside>

  {/* MAIN CONTENT */}

  <section className="flex-1 min-w-0 p-5 md:p-10">

    {/* HEADER */}

    <header className="flex justify-between items-center mb-10">

      <div>
        <p className="text-[#E41E26] text-xs tracking-[3px] font-bold">
          YOUR UNIVERSE
        </p>

        <h2 className="text-3xl md:text-4xl font-bold mt-3 tracking-tight">
          Welcome back, {firstName}
        </h2>

        <p className="text-gray-500 text-sm mt-2">
          Something extraordinary is waiting for you.
        </p>
      </div>

      <div className="flex items-center gap-3">

        <div className="hidden sm:block text-right">
          <p className="text-sm font-bold">
            {firstName}
          </p>

          <p className="text-xs text-gray-400">
            NEXA Member
          </p>
        </div>

        <div className="w-12 h-12 rounded-full bg-[#E41E26] text-white flex items-center justify-center text-xl font-bold shadow-md">
          {firstName.charAt(0).toUpperCase()}
        </div>

      </div>

    </header>

    {/* RED WELCOME BANNER */}

    <section className="bg-[#E41E26] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden mb-12 shadow-xl">

      <div className="absolute right-[-60px] top-[-100px] w-80 h-80 rounded-full border-[35px] border-white/10" />

      <div className="absolute right-10 bottom-[-100px] w-64 h-64 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 max-w-2xl">

        <span className="text-xs tracking-[3px] text-white/80 font-semibold">
          ✦ ONE UNIVERSE. ENDLESS POSSIBILITIES.
        </span>

        <h1 className="text-4xl md:text-6xl font-black mt-7 leading-tight tracking-tight">
          Your world.
          <br />
          Your possibilities.
        </h1>

        <p className="text-white/85 mt-6 leading-7 text-sm md:text-base max-w-lg">
          Connect with people, discover knowledge,
          share experiences and explore a universe
          built for curious minds.
        </p>

        <button
          onClick={() => setSection("Discover")}
          className="mt-9 bg-white text-[#E41E26] px-8 py-4 rounded-full font-bold text-sm hover:bg-[#fff0f0] hover:scale-105 transition-all shadow-lg"
        >
          Explore NEXA →
        </button>

      </div>

    </section>

    {/* EXPLORE */}

    <div className="mb-8">

      <p className="text-[#E41E26] text-xs font-bold tracking-[3px] uppercase">
        DISCOVER MORE
      </p>

      <h2 className="text-3xl font-bold mt-3">
        Explore your universe.
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Everything you need, all in one place.
      </p>

    </div>

    {/* DASHBOARD CARDS */}

    {section === "Home" ? (

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">

        {navigation.slice(1).map((item) => (

          <button
            key={item.name}
            onClick={() => setSection(item.name)}
            className="group text-left bg-white border border-gray-100 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:border-[#E41E26]/40 transition-all duration-300"
          >

            <div className="w-14 h-14 rounded-2xl bg-[#FFF0F0] text-[#E41E26] flex items-center justify-center text-3xl group-hover:bg-[#E41E26] group-hover:text-white transition-all duration-300">
              {item.icon}
            </div>

            <h3 className="text-xl font-bold mt-7">
              {item.name}
            </h3>

            <p className="text-sm text-gray-500 mt-3 leading-6">
              {descriptions[item.name]}
            </p>

            <div className="mt-8 flex justify-between items-center">

              <span className="text-[#E41E26] text-sm font-bold">
                Explore
              </span>

              <span className="text-gray-400 group-hover:text-[#E41E26] group-hover:translate-x-1 transition-all">
                →
              </span>

            </div>

          </button>

        ))}

      </div>

    ) : (

      <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-12 shadow-sm">

        <div className="w-16 h-16 rounded-2xl bg-[#FFF0F0] text-[#E41E26] flex items-center justify-center text-4xl">
          {navigation.find((item) => item.name === section)?.icon}
        </div>

        <h3 className="text-3xl font-bold mt-7">
          {section}
        </h3>

        <p className="text-gray-500 mt-4 max-w-xl leading-7">
          {descriptions[section]}
        </p>

        <div className="mt-8 p-7 bg-[#FFF5F5] rounded-2xl border border-red-100">

          <p className="text-[#E41E26] text-xs font-bold tracking-[2px]">
            COMING TO NEXA
          </p>

          <p className="text-gray-600 text-sm mt-3 leading-7">
            We're building this experience as part of
            the NEXA universe. More features and
            possibilities are coming.
          </p>

        </div>

        <button
          onClick={() => setSection("Home")}
          className="mt-8 bg-[#E41E26] hover:bg-[#C81018] text-white px-7 py-3 rounded-full text-sm font-bold transition"
        >
          ← Back to Home
        </button>

      </div>

    )}

    {/* FOOTER */}

    <footer className="mt-16 pt-7 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-3 text-xs text-gray-400">

      <span>© 2026 NEXA</span>

      <span>ONE UNIVERSE. ENDLESS POSSIBILITIES.</span>

      <span>BUILT FOR EVERY CURIOUS MIND ✦</span>

    </footer>

  </section>

</main>


); }