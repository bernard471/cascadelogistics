"use client";

// Reserved for a possible future reCAPTCHA rollout. This component is not
// imported by the active registration flow.
import { useEffect, useId, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
          "error-callback": () => void;
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface RecaptchaCheckboxProps {
  onTokenChange: (token: string) => void;
}

export default function RecaptchaCheckbox({ onTokenChange }: RecaptchaCheckboxProps) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const reactId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<number>();
  const normalizedId = `recaptcha-${reactId.replace(/:/g, "")}`;

  useEffect(() => {
    if (!siteKey) {
      if (process.env.NODE_ENV !== "production") {
        onTokenChange("development-bypass");
      }
      return;
    }

    let cancelled = false;
    const renderWidget = () => {
      if (
        cancelled ||
        !containerRef.current ||
        !window.grecaptcha ||
        widgetIdRef.current !== undefined
      ) {
        return;
      }

      widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: onTokenChange,
        "expired-callback": () => onTokenChange(""),
        "error-callback": () => onTokenChange(""),
      });
    };

    if (window.grecaptcha) {
      renderWidget();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-cascade-recaptcha="true"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", renderWidget);
      } else {
        const script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.cascadeRecaptcha = "true";
        script.addEventListener("load", renderWidget);
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
    };
  }, [onTokenChange, siteKey]);

  if (!siteKey && process.env.NODE_ENV === "production") {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Registration protection is not configured. Please contact support.
      </p>
    );
  }

  if (!siteKey) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        Development mode: reCAPTCHA is bypassed until its environment keys are configured.
      </p>
    );
  }

  return <div id={normalizedId} ref={containerRef} aria-label="Anti-bot verification" />;
}
