import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initPostHog } from "./lib/posthog";
import { supabase } from "./integrations/supabase/client";

initPostHog();

// Verify Supabase connection
supabase.auth.getSession().then(() => {
  console.log("Supabase connected successfully");
}).catch((err) => {
  console.error("Supabase connection failed:", err);
});

createRoot(document.getElementById("root")!).render(<App />);
