import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Icon from "./icon";

const PwaInstallContext = createContext(null);

function detectIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

export function PwaInstallProvider({ children }) {
  const [promptEvent, setPromptEvent] = useState(null);
  const [ios] = useState(detectIOS);
  const [installed, setInstalled] = useState(detectStandalone);
  useEffect(() => {
    const onPrompt = (event) => { event.preventDefault(); setPromptEvent(event); };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);
  const value = useMemo(() => ({
    available: !installed && (Boolean(promptEvent) || ios),
    ios,
    async prompt() {
      if (!promptEvent) return false;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      setPromptEvent(null);
      return choice.outcome === "accepted";
    },
  }), [installed, ios, promptEvent]);
  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function PwaInstallButton({ className = "" }) {
  const install = useContext(PwaInstallContext);
  const [instructions, setInstructions] = useState(false);
  if (!install?.available) return null;
  async function handleInstall() {
    if (install.ios) setInstructions(true);
    else await install.prompt();
  }
  return <>
    <button type="button" className={`pwa-install-button ${className}`} onClick={handleInstall} aria-label="Install QR Verify on this device">
      <Icon name="download" size={18} /><span>Install app</span>
    </button>
    {instructions && <div className="pwa-install-backdrop" role="presentation" onClick={() => setInstructions(false)}>
      <section className="pwa-install-dialog" role="dialog" aria-modal="true" aria-labelledby="pwa-install-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="pwa-install-close" onClick={() => setInstructions(false)} aria-label="Close install instructions"><Icon name="close" /></button>
        <h2 id="pwa-install-title">Add QR Verify to Home Screen</h2>
        <p>In Safari, tap <Icon name="share" size={18} /> <strong>Share</strong>, then choose <strong>Add to Home Screen</strong>.</p>
        <button type="button" className="portal-button" onClick={() => setInstructions(false)}>Got it</button>
      </section>
    </div>}
  </>;
}
