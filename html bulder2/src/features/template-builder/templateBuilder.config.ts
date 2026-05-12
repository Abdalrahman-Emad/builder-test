import type { EditorConfig } from "grapesjs";
import type { TemplateVariable } from "./templateBuilder.types";

const icons = {
  text: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 10h16M4 14h10"/></svg>`,
  heading: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h16M4 12h16M4 19h10M9 5v14"/></svg>`,
  image: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
  button: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="5"/><path d="M9 12h6"/></svg>`,
  divider: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18"/></svg>`,
  spacer: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M5 6l7-3 7 3M5 18l7 3 7-3"/></svg>`,
  columns2: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/></svg>`,
  columns3: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="5" height="16" rx="1"/></svg>`,
  variable: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7c0-1.1.9-2 2-2h2l4 10h2l4-10h2a2 2 0 0 1 2 2"/><path d="M4 17c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2"/></svg>`,
  link: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  input: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h10"/></svg>`,
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const NOTIFICATION_BLOCKS = [
  {
    id: "two-columns",
    label: "2 Columns",
    category: "Layout",
    media: icons.columns2,
    content: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td width="50%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;margin:0;">Left column content</p></td>
          <td width="50%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;margin:0;">Right column content</p></td>
        </tr>
      </table>`,
  },
  {
    id: "three-columns",
    label: "3 Columns",
    category: "Layout",
    media: icons.columns3,
    content: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
        <tr>
          <td width="33.33%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;">Column 1</p></td>
          <td width="33.33%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;">Column 2</p></td>
          <td width="33.33%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;">Column 3</p></td>
        </tr>
      </table>`,
  },
  {
    id: "heading-1",
    label: "Heading H1",
    category: "Typography",
    media: icons.heading,
    content: `<h1 style="font-family:Arial,sans-serif;font-size:28px;font-weight:700;color:#111827;margin:0 0 12px;line-height:1.3;">Your Heading Here</h1>`,
  },
  {
    id: "heading-2",
    label: "Heading H2",
    category: "Typography",
    media: icons.heading,
    content: `<h2 style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#1f2937;margin:0 0 10px;line-height:1.35;">Your Subheading Here</h2>`,
  },
  {
    id: "text",
    label: "Text",
    category: "Typography",
    media: icons.text,
    content: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#374151;margin:0 0 16px;">Add your paragraph text here.</p>`,
  },
  {
    id: "link-text",
    label: "Link",
    category: "Typography",
    media: icons.link,
    content: `<a href="{{link}}" style="font-family:Arial,sans-serif;font-size:15px;color:#4f46e5;text-decoration:underline;">Click here</a>`,
  },
  {
    id: "image",
    label: "Image",
    category: "Media",
    media: icons.image,
    content: {
      type: "image",
      style: { display: "block", maxWidth: "100%", height: "auto" },
      attributes: {
        src: "https://placehold.co/600x240/f3f4f6/6b7280?text=Image",
        alt: "Template image",
      },
    },
  },
  {
    id: "button",
    label: "Button",
    category: "Components",
    media: icons.button,
    content: `
      <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="text-align:center;margin:24px 0;">
        <tr>
          <td>
            <a href="{{link}}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;">Call to Action</a>
          </td>
        </tr>
      </table>`,
  },
  {
    id: "divider",
    label: "Divider",
    category: "Components",
    media: icons.divider,
    content: `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`,
  },
  {
    id: "spacer",
    label: "Spacer",
    category: "Components",
    media: icons.spacer,
    content: `<div style="height:32px;line-height:32px;font-size:1px;">&nbsp;</div>`,
  },
  {
    id: "header-logo",
    label: "Header",
    category: "Components",
    media: icons.image,
    content: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111827;padding:24px 32px;border-radius:8px 8px 0 0;">
        <tr><td><span style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;">{{companyName}}</span></td></tr>
      </table>`,
  },
  {
    id: "footer-text",
    label: "Footer",
    category: "Components",
    media: icons.text,
    content: `
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;margin-top:32px;">
        <tr>
          <td style="text-align:center;">
            <p style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;margin:0;line-height:1.6;">
              &copy; 2026 {{companyName}}. All rights reserved.<br/>
              <a href="#" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>`,
  },
  {
    id: "form-wrapper",
    label: "Form",
    category: "Forms",
    media: icons.input,
    content: `
      <form action="#" method="post" style="font-family:Arial,sans-serif;margin:0;padding:0;">
        <div style="display:grid;gap:14px;">
          <label style="display:block;font-size:13px;font-weight:700;color:#374151;">
            Full Name
            <input type="text" name="name" placeholder="Enter full name" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;" />
          </label>
          <button type="submit" style="display:inline-block;background:#4f46e5;color:#ffffff;border:0;border-radius:6px;padding:12px 18px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Submit</button>
        </div>
      </form>`,
  },
  {
    id: "input-text",
    label: "Text Input",
    category: "Forms",
    media: icons.input,
    content: `
      <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
        Label
        <input type="text" name="field" placeholder="Enter value" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;" />
      </label>`,
  },
  {
    id: "input-email",
    label: "Email Input",
    category: "Forms",
    media: icons.input,
    content: `
      <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
        Email
        <input type="email" name="email" placeholder="name@example.com" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;" />
      </label>`,
  },
  {
    id: "textarea",
    label: "Textarea",
    category: "Forms",
    media: icons.input,
    content: `
      <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
        Message
        <textarea name="message" rows="4" placeholder="Write message" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;resize:vertical;"></textarea>
      </label>`,
  },
  {
    id: "select",
    label: "Select",
    category: "Forms",
    media: icons.input,
    content: `
      <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
        Select Option
        <select name="option" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;background:#ffffff;">
          <option>Option one</option>
          <option>Option two</option>
          <option>Option three</option>
        </select>
      </label>`,
  },
  {
    id: "checkbox",
    label: "Checkbox",
    category: "Forms",
    media: icons.input,
    content: `
      <label style="display:flex;align-items:flex-start;gap:8px;font-family:Arial,sans-serif;font-size:14px;color:#374151;margin:0 0 14px;">
        <input type="checkbox" name="agree" style="margin-top:2px;" />
        <span>I agree to the terms</span>
      </label>`,
  },
];

export function buildVariableBlock(variable: TemplateVariable) {
  const key = escapeHtml(variable.key);
  const label = escapeHtml(variable.label);

  return {
    id: `var-${variable.key}`,
    label,
    category: "Variables",
    media: icons.variable,
    content: `<span class="template-variable" data-var-key="${key}" style="display:inline-block;background:#fef3c7;border:1px dashed #f59e0b;border-radius:3px;padding:1px 6px;font-family:monospace;font-size:13px;color:#92400e;font-weight:700;">{{${key}}}</span>`,
    attributes: { title: `Insert variable: {{${variable.key}}}` },
  };
}

export const DEFAULT_CANVAS_HTML = `
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;min-height:600px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.12);">
          <tr>
            <td style="background:#111827;padding:28px 40px;">
              <h1 style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;margin:0;">{{companyName}}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#111827;margin:0 0 16px;line-height:1.35;">Hello, <span class="template-variable" data-var-key="name" style="display:inline-block;background:#fef3c7;border:1px dashed #f59e0b;border-radius:3px;padding:1px 6px;font-family:monospace;font-size:20px;color:#92400e;font-weight:700;">{{name}}</span></h2>
              <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#374151;margin:0 0 24px;">Build a clean production-ready notification template with reusable content blocks and backend variables.</p>
              <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="text-align:center;margin:24px 0;">
                <tr><td><a href="{{link}}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;">Get Started</a></td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
              <p style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;margin:0;">&copy; 2026 {{companyName}}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;

export function buildEditorConfig(
  containerId: string,
  blocksContainerId: string,
  styleManagerContainerId: string
): EditorConfig {
  return {
    container: `#${containerId}`,
    fromElement: false,
    height: "100%",
    width: "100%",
    storageManager: false,
    blockManager: {
      appendTo: `#${blocksContainerId}`,
      blocks: [],
    custom: true,
    },
    styleManager: {
      appendTo: `#${styleManagerContainerId}`,
      sectors: [
        {
          name: "Typography",
          open: true,
          properties: [
            {
              property: "font-family",
              type: "select",
              options: [
                { id: "Arial, sans-serif", label: "Arial" },
                { id: "Georgia, serif", label: "Georgia" },
                { id: "Helvetica, Arial, sans-serif", label: "Helvetica" },
                { id: "Verdana, sans-serif", label: "Verdana" },
              ],
            },
            { property: "font-size" },
            {
              property: "font-weight",
              type: "select",
              options: [
                { id: "400", label: "Normal" },
                { id: "600", label: "Semi Bold" },
                { id: "700", label: "Bold" },
              ],
            },
            { property: "color", type: "color" },
            { property: "line-height" },
            {
              property: "text-align",
              type: "radio",
              options: [
                { id: "left", label: "Left" },
                { id: "center", label: "Center" },
                { id: "right", label: "Right" },
              ],
            },
          ],
        },
        {
          name: "Spacing",
          open: false,
          properties: [
            { property: "margin", type: "composite" },
            { property: "padding", type: "composite" },
          ],
        },
        {
          name: "Dimensions",
          open: false,
          properties: [{ property: "width" }, { property: "max-width" }, { property: "height" }],
        },
        {
          name: "Background",
          open: false,
          properties: [{ property: "background-color", type: "color" }],
        },
        {
          name: "Border",
          open: false,
          properties: [{ property: "border-radius" }, { property: "border", type: "composite" }],
        },
      ],
    },
    // panels: { defaults: [] },
    deviceManager: {
      devices: [
        { name: "Desktop", width: "" },
        { name: "Tablet", width: "768px", widthMedia: "992px" },
        { name: "Mobile", width: "375px", widthMedia: "480px" },
      ],
    },
    components: DEFAULT_CANVAS_HTML,
  };
}

export function extractVariables(html: string): string[] {
  const found = new Set<string>();
  const regex = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    found.add(match[1].trim());
  }

  return Array.from(found);
}

export function buildExportHTML(rawHtml: string, rawCss: string): string {
  const cleanHtml = rawHtml
    .replace(/\sdata-gjs-[a-z-]+="[^"]*"/g, "")
    .replace(/\sdata-highlightable="[^"]*"/g, "")
    .replace(/\sid="i[a-z0-9]+"/g, "")
    .trim();

  const cleanCss = rawCss.replace(/\*\s*\{[^}]*box-sizing[^}]*\}/g, "").trim();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Notification Template</title>
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    img { border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    a { color: inherit; }
${cleanCss ? cleanCss.split("\n").map((line) => `    ${line}`).join("\n") : ""}
  </style>
</head>
<body>
${cleanHtml.split("\n").map((line) => `  ${line}`).join("\n")}
</body>
</html>`;
}

/*******************************************/
// import type { EditorConfig } from "grapesjs";
// import type { TemplateVariable } from "./templateBuilder.types";
// import { regex } from "zod";

// const icons = {
//   text: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 10h16M4 14h10"/></svg>`,
//   heading: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h16M4 12h16M4 19h10M9 5v14"/></svg>`,
//   image: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
//   button: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="5"/><path d="M9 12h6"/></svg>`,
//   divider: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 12h18"/></svg>`,
//   spacer: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v18M5 6l7-3 7 3M5 18l7 3 7-3"/></svg>`,
//   columns2: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/></svg>`,
//   columns3: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="17" y="4" width="5" height="16" rx="1"/></svg>`,
//   variable: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7c0-1.1.9-2 2-2h2l4 10h2l4-10h2a2 2 0 0 1 2 2"/><path d="M4 17c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2"/></svg>`,
//   link: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
//   input: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h6M7 14h10"/></svg>`,
// };

// function escapeHtml(value: string) {
//   return value
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/"/g, "&quot;");
// }

// export const NOTIFICATION_BLOCKS = [
//   {
//     id: "two-columns",
//     label: "2 Columns",
//     category: {label: "Layout", open: true},
//     media: icons.columns2,
//     content: `
//       <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
//         <tr>
//           <td width="50%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;margin:0;">Left column content</p></td>
//           <td width="50%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#374151;margin:0;">Right column content</p></td>
//         </tr>
//       </table>`,
//   },
//   {
//     id: "three-columns",
//     label: "3 Columns",
//     category: {label: "Layout", open: true},
//     media: icons.columns3,
//     content: `
//       <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;">
//         <tr>
//           <td width="33.33%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;">Column 1</p></td>
//           <td width="33.33%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;">Column 2</p></td>
//           <td width="33.33%" style="padding:8px;vertical-align:top;"><p style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#374151;margin:0;">Column 3</p></td>
//         </tr>
//       </table>`,
//   },
//   {
//     id: "heading-1",
//     label: "Heading H1",
//     category: {label: "Typography", open: true},
//     media: icons.heading,
//     content: `<h1 style="font-family:Arial,sans-serif;font-size:28px;font-weight:700;color:#111827;margin:0 0 12px;line-height:1.3;">Your Heading Here</h1>`,
//   },
//   {
//     id: "heading-2",
//     label: "Heading H2",
//     category: {label: "Typography", open: true},
//     media: icons.heading,
//     content: `<h2 style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#1f2937;margin:0 0 10px;line-height:1.35;">Your Subheading Here</h2>`,
//   },
//   {
//     id: "text",
//     label: "Text",
//     category: {label: "Typography", open: true},
//     media: icons.text,
//     content: `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#374151;margin:0 0 16px;">Add your paragraph text here.</p>`,
//   },
//   {
//     id: "link-text",
//     label: "Link",
//     category: {label: "Typography", open: true},
//     media: icons.link,
//     content: `<a href="{{link}}" style="font-family:Arial,sans-serif;font-size:15px;color:#4f46e5;text-decoration:underline;">Click here</a>`,
//   },
//   {
//     id: "image",
//     label: "Image",
//     category: {label: "Media", open: true},
//     media: icons.image,
//     content: {
//       type: "image",
//       style: { display: "block", maxWidth: "100%", height: "auto" },
//       attributes: {
//         src: "https://placehold.co/600x240/f3f4f6/6b7280?text=Image",
//         alt: "Template image",
//       },
//     },
//   },
//   {
//     id: "button",
//     label: "Button",
//     category: {label: "Components", open: true},
//     media: icons.button,
//     content: `
//       <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="text-align:center;margin:24px 0;">
//         <tr>
//           <td>
//             <a href="{{link}}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;">Call to Action</a>
//           </td>
//         </tr>
//       </table>`,
//   },
//   {
//     id: "divider",
//     label: "Divider",
//     category: {label: "Components", open: true},
//     media: icons.divider,
//     content: `<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />`,
//   },
//   {
//     id: "spacer",
//     label: "Spacer",
//     category: {label: "Components", open: true},
//     media: icons.spacer,
//     content: `<div style="height:32px;line-height:32px;font-size:1px;">&nbsp;</div>`,
//   },
//   {
//     id: "header-logo",
//     label: "Header",
//     category: {label: "Components", open: true},
//     media: icons.image,
//     content: `
//       <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#111827;padding:24px 32px;border-radius:8px 8px 0 0;">
//         <tr><td><span style="font-family:Arial,sans-serif;font-size:20px;font-weight:700;color:#ffffff;">{{companyName}}</span></td></tr>
//       </table>`,
//   },
//   {
//     id: "footer-text",
//     label: "Footer",
//     category: {label: "Components", open: true},
//     media: icons.text,
//     content: `
//       <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;margin-top:32px;">
//         <tr>
//           <td style="text-align:center;">
//             <p style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;margin:0;line-height:1.6;">
//               &copy; 2026 {{companyName}}. All rights reserved.<br/>
//               <a href="#" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
//             </p>
//           </td>
//         </tr>
//       </table>`,
//   },
//   {
//     id: "form-wrapper",
//     label: "Form",
//     category: {label: "Forms", open: true},
//     media: icons.input,
//     content: `
//       <form action="#" method="post" style="font-family:Arial,sans-serif;margin:0;padding:0;">
//         <div style="display:grid;gap:14px;">
//           <label style="display:block;font-size:13px;font-weight:700;color:#374151;">
//             Full Name
//             <input type="text" name="name" placeholder="Enter full name" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;" />
//           </label>
//           <button type="submit" style="display:inline-block;background:#4f46e5;color:#ffffff;border:0;border-radius:6px;padding:12px 18px;font-family:Arial,sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Submit</button>
//         </div>
//       </form>`,
//   },
//   {
//     id: "input-text",
//     label: "Text Input",
//     category: {label: "Forms", open: true},
//     media: icons.input,
//     content: `
//       <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
//         Label
//         <input type="text" name="field" placeholder="Enter value" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;" />
//       </label>`,
//   },
//   {
//     id: "input-email",
//     label: "Email Input",
//     category: {label: "Forms", open: true},
//     media: icons.input,
//     content: `
//       <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
//         Email
//         <input type="email" name="email" placeholder="name@example.com" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;" />
//       </label>`,
//   },
//   {
//     id: "textarea",
//     label: "Textarea",
//     category: {label: "Forms", open: true},
//     media: icons.input,
//     content: `
//       <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
//         Message
//         <textarea name="message" rows="4" placeholder="Write message" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;resize:vertical;"></textarea>
//       </label>`,
//   },
//   {
//     id: "select",
//     label: "Select",
//     category: {label: "Forms", open: true},
//     media: icons.input,
//     content: `
//       <label style="display:block;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0 0 14px;">
//         Select Option
//         <select name="option" style="display:block;width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d1d5db;border-radius:6px;font-family:Arial,sans-serif;font-size:14px;color:#111827;background:#ffffff;">
//           <option>Option one</option>
//           <option>Option two</option>
//           <option>Option three</option>
//         </select>
//       </label>`,
//   },
//   {
//     id: "checkbox",
//     label: "Checkbox",
//     category: {label: "Forms", open: true},
//     media: icons.input,
//     content: `
//       <label style="display:flex;align-items:flex-start;gap:8px;font-family:Arial,sans-serif;font-size:14px;color:#374151;margin:0 0 14px;">
//         <input type="checkbox" name="agree" style="margin-top:2px;" />
//         <span>I agree to the terms</span>
//       </label>`,
//   },
// ];

// export function buildVariableBlock(variable: TemplateVariable) {
//   const key = escapeHtml(variable.key);
//   const label = escapeHtml(variable.label);

//   return {
//     id: `var-${variable.key}`,
//     label,
//     category: "Variables",
//     media: icons.variable,
//     content: `<span class="template-variable" data-var-key="${key}" style="display:inline-block;background:#fef3c7;border:1px dashed #f59e0b;border-radius:3px;padding:1px 6px;font-family:monospace;font-size:13px;color:#92400e;font-weight:700;">{{${key}}}</span>`,
//     attributes: { title: `Insert variable: {{${variable.key}}}` },
//   };
// }

// export const DEFAULT_CANVAS_HTML = `
//   <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;min-height:600px;">
//     <tr>
//       <td align="center">
//         <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.12);">
//           <tr>
//             <td style="background:#111827;padding:28px 40px;">
//               <h1 style="font-family:Arial,sans-serif;font-size:22px;font-weight:700;color:#ffffff;margin:0;">{{companyName}}</h1>
//             </td>
//           </tr>
//           <tr>
//             <td style="padding:40px;">
//               <h2 style="font-family:Arial,sans-serif;font-size:24px;font-weight:700;color:#111827;margin:0 0 16px;line-height:1.35;">Hello, <span class="template-variable" data-var-key="name" style="display:inline-block;background:#fef3c7;border:1px dashed #f59e0b;border-radius:3px;padding:1px 6px;font-family:monospace;font-size:20px;color:#92400e;font-weight:700;">{{name}}</span></h2>
//               <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#374151;margin:0 0 24px;">Build a clean production-ready notification template with reusable content blocks and backend variables.</p>
//               <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="text-align:center;margin:24px 0;">
//                 <tr><td><a href="{{link}}" style="display:inline-block;background:#4f46e5;color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:6px;">Get Started</a></td></tr>
//               </table>
//             </td>
//           </tr>
//           <tr>
//             <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
//               <p style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;margin:0;">&copy; 2026 {{companyName}}. All rights reserved.</p>
//             </td>
//           </tr>
//         </table>
//       </td>
//     </tr>
//   </table>`;

// export function buildEditorConfig(
//   containerId: string,
//   blocksContainerId: string,
//   styleManagerContainerId: string
// ): EditorConfig {
//   return {
//     container: `#${containerId}`,
//     fromElement: false,
//     height: "100%",
//     width: "100%",
//     storageManager: false,
//     blockManager: {
//       appendTo: `#${blocksContainerId}`,
//       blocks: [],
//     custom: true,
//     },
//     styleManager: {
//       appendTo: `#${styleManagerContainerId}`,
//       sectors: [
//         {
//           name: "Typography",
//           open: true,
//           properties: [
//             {
//               property: "font-family",
//               type: "select",
//               options: [
//                 { id: "Arial, sans-serif", label: "Arial" },
//                 { id: "Georgia, serif", label: "Georgia" },
//                 { id: "Helvetica, Arial, sans-serif", label: "Helvetica" },
//                 { id: "Verdana, sans-serif", label: "Verdana" },
//               ],
//             },
//             { property: "font-size" },
//             {
//               property: "font-weight",
//               type: "select",
//               options: [
//                 { id: "400", label: "Normal" },
//                 { id: "600", label: "Semi Bold" },
//                 { id: "700", label: "Bold" },
//               ],
//             },
//             { property: "color", type: "color" },
//             { property: "line-height" },
//             {
//               property: "text-align",
//               type: "radio",
//               options: [
//                 { id: "left", label: "Left" },
//                 { id: "center", label: "Center" },
//                 { id: "right", label: "Right" },
//               ],
//             },
//           ],
//         },
//         {
//           name: "Spacing",
//           open: false,
//           properties: [
//             { property: "margin", type: "composite" },
//             { property: "padding", type: "composite" },
//           ],
//         },
//         {
//           name: "Dimensions",
//           open: false,
//           properties: [{ property: "width" }, { property: "max-width" }, { property: "height" }],
//         },
//         {
//           name: "Background",
//           open: false,
//           properties: [{ property: "background-color", type: "color" }],
//         },
//         {
//           name: "Border",
//           open: false,
//           properties: [{ property: "border-radius" }, { property: "border", type: "composite" }],
//         },
//       ],
//     },
//     // panels: { defaults: [] },
//     deviceManager: {
//       devices: [
//         { name: "Desktop", width: "" },
//         { name: "Tablet", width: "768px", widthMedia: "992px" },
//         { name: "Mobile", width: "375px", widthMedia: "480px" },
//       ],
//     },
//     components: DEFAULT_CANVAS_HTML,
//   };
// }

// export function extractVariables(html: string): string[] {
//   const found = new Set<string>();
//   const regex = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

//   let match: RegExpExecArray | null;

//   while ((match = regex.exec(html))) {
//     const value = regex.exec(html);
//     if (!match) break;

//     found.add(match[1]!.trim());

//   }
//   return Array.from(found)
// }

// export function buildExportHTML(rawHtml: string, rawCss: string): string {
//   const cleanHtml = rawHtml
//     .replace(/\sdata-gjs-[a-z-]+="[^"]*"/g, "")
//     .replace(/\sdata-highlightable="[^"]*"/g, "")
//     .replace(/\sid="i[a-z0-9]+"/g, "")
//     .trim();

//   const cleanCss = rawCss.replace(/\*\s*\{[^}]*box-sizing[^}]*\}/g, "").trim();

//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>Notification Template</title>
//   <style>
//     body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
//     img { border: 0; outline: none; text-decoration: none; max-width: 100%; height: auto; }
//     table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
//     a { color: inherit; }
// ${cleanCss ? cleanCss.split("\n").map((line) => `    ${line}`).join("\n") : ""}
//   </style>
// </head>
// <body>
// ${cleanHtml.split("\n").map((line) => `  ${line}`).join("\n")}
// </body>
// </html>`;
// }
