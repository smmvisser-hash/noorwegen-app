// Koppeling met Supabase. De gegevens (Project URL en anon/publishable key) staan niet in de code,
// maar worden door Netlify meegegeven bij het bouwen (Environment variables
// VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY). Zonder die gegevens werkt de app alleen lokaal.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const sleutel = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && sleutel ? createClient(url, sleutel) : null;

// De "backend" zoals de lokale opslag (opslag.js) hem gebruikt.
export const backend = supabase && {
  async ingelogd() {
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  },
  async gebruiker() {
    const { data } = await supabase.auth.getSession();
    return data.session?.user ?? null;
  },
  async inloggen(email, wachtwoord) {
    const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord });
    if (error) throw error;
  },
  async uitloggen() {
    await supabase.auth.signOut();
  },
  async verstuur(rijen) {
    const { error } = await supabase.from('items').upsert(rijen);
    if (error) throw error;
  },
  async haalOp(vanaf) {
    const rijen = [];
    // In blokken van 1000 ophalen (maximum per verzoek).
    for (let begin = 0; ; begin += 1000) {
      let vraag = supabase.from('items').select('id, soort, data, verwijderd, gewijzigd_op').order('gewijzigd_op').range(begin, begin + 999);
      if (vanaf) vraag = vraag.gt('gewijzigd_op', vanaf);
      const { data, error } = await vraag;
      if (error) throw error;
      rijen.push(...data);
      if (data.length < 1000) return rijen;
    }
  },
};
