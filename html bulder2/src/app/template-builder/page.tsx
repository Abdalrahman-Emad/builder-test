
// // import TemplateBuilderPage from "@cib/features-notifications";

// // export default function TemplatesPage() {
// //   return <TemplateBuilderPage />
      
// // }



// "use client";

// import { useState } from "react";

// import TemplateBuilderPage from "@cib/features-notifications";
// import MessageForm from "./MessageForm";

// export default function TemplatesPage() {
//   const [htmlTemplate, setHtmlTemplate] = useState("");

//   return (
//     <div>
//       <TemplateBuilderPage
//         onSave={(payload) => {
//           console.log("saved html", payload.html);

//           setHtmlTemplate(payload.html);
//         }}
//       />

//       <MessageForm html={htmlTemplate} />
//     </div>
//   );
// }



/************************** */


// import { useEffect, useState } from "react";

// interface MessageFormProps {
//   html: string;
// }

// export default function MessageForm({
//   html,
// }: MessageFormProps) {
//   const [value, setValue] = useState("");

//   useEffect(() => {
//     if (html) {
//       setValue(html);
//     }
//   }, [html]);

//   return (
//     <textarea
//       value={value}
//       onChange={(e) => setValue(e.target.value)}
//       rows={10}
//     />
//   );
// }