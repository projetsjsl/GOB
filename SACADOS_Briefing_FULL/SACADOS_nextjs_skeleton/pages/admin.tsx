
import dynamic from "next/dynamic";
const TriggerBriefing = dynamic(()=>import("../components/TriggerBriefing"), { ssr:false });
const AdhocComposer = dynamic(()=>import("../components/AdhocComposer"), { ssr:false });

export default function AdminPage() {
  return (
    <main style={{maxWidth:900, margin:"40px auto", padding:"0 16px"}}>
      <h1>SACADOS — Console Admin</h1>
      <p>Déclenche les briefings standard (fallback si cron/n8n down) ou crée des envois ad-hoc avec ton propre prompt.</p>
      <section>
        <h2>Déclencheurs standard</h2>
        <TriggerBriefing/>
      </section>
      <section>
        <h2>Envois ad-hoc (prompt libre)</h2>
        <AdhocComposer/>
      </section>
      <footer style={{marginTop:40, opacity:0.7}}>Protéger cette page par auth et header x-admin-token.</footer>
    </main>
  );
}
