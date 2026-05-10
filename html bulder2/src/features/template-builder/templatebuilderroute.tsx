// "use client";

// import { useEffect, useState, type FC } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// import { TemplateBuilderPage } from "./TemplateBuilderPage";
// import type { TemplateSavePayload } from "./templateBuilder.types";

// const API_BASE = "/api/notifications/templates";

// async function fetchTemplate(
//   templateKey: string
// ): Promise<TemplateSavePayload | null> {
//   try {
//     const response = await fetch(`${API_BASE}/${templateKey}`, {
//       cache: "no-store",
//     });

//     if (!response.ok) return null;
//     return response.json();
//   } catch {
//     return null;
//   }
// }

// async function saveTemplate(payload: TemplateSavePayload): Promise<void> {
//   const isNewTemplate = payload.version <= 1;
//   const response = await fetch(
//     isNewTemplate ? API_BASE : `${API_BASE}/${payload.templateKey}`,
//     {
//       method: isNewTemplate ? "POST" : "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(payload),
//     }
//   );

//   if (!response.ok) {
//     const message = await response.text();
//     throw new Error(`Save failed (${response.status}): ${message}`);
//   }
// }

// export const TemplateBuilderRoute: FC = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const templateKey = searchParams.get("key");
//   const [template, setTemplate] = useState<TemplateSavePayload | null>(null);
//   const [loading, setLoading] = useState(Boolean(templateKey));
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!templateKey) return;

//     let active = true;

//     fetchTemplate(templateKey)
//       .then((data) => {
//         if (!active) return;

//         if (!data) {
//           setError(`Template "${templateKey}" was not found.`);
//           return;
//         }

//         setTemplate(data);
//       })
//       .catch(() => {
//         if (active) setError("Failed to load template.");
//       })
//       .finally(() => {
//         if (active) setLoading(false);
//       });

//     return () => {
//       active = false;
//     };
//   }, [templateKey]);

//   if (loading) {
//     return (
//       <div style={routeShellStyle}>
//         <div style={spinnerStyle} />
//         <style>
//           {`
//             @keyframes template-builder-spin {
//               to { transform: rotate(360deg); }
//             }
//           `}
//         </style>
//         <span>Loading template...</span>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ ...routeShellStyle, color: "#fecaca" }}>
//         <span>{error}</span>
//         <button type="button" onClick={() => router.back()} style={routeButtonStyle}>
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   return (
//     <TemplateBuilderPage
//       initialTemplate={template}
//       onSave={saveTemplate}
//       onBack={() => router.back()}
//     />
//   );
// };

// const routeShellStyle = {
//   height: "100vh",
//   display: "flex",
//   flexDirection: "column" as const,
//   alignItems: "center",
//   justifyContent: "center",
//   gap: 16,
//   background: "#10121f",
//   color: "#94a3b8",
//   fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
//   fontSize: 14,
// };

// const spinnerStyle = {
//   width: 40,
//   height: 40,
//   border: "3px solid rgba(129, 140, 248, 0.22)",
//   borderTopColor: "#818cf8",
//   borderRadius: "50%",
//   animation: "template-builder-spin 0.8s linear infinite",
// };

// const routeButtonStyle = {
//   minHeight: 36,
//   padding: "0 16px",
//   background: "rgba(255,255,255,0.07)",
//   border: "1px solid rgba(148, 163, 184, 0.18)",
//   borderRadius: 7,
//   color: "#f8fafc",
//   cursor: "pointer",
//   fontFamily: "inherit",
//   fontWeight: 700,
// };

// export default TemplateBuilderRoute;
