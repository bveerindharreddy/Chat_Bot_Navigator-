// Widget interface text (buttons, labels, notices) in the widget's language. The assistant's own replies follow the
// language set in the console; this keeps the interface around them in the same language, right-to-left where needed.

export type Strings = {
  typeHere: string; send: string; startCall: string; endCall: string; talk: string; minimise: string;
  newConv: string; clearConv: string; chatWith: string; greeting: string; talkHuman: string; call: string;
  whatsapp: string; email: string; disclosure: string; privacy: string; poweredBy: string; reconnecting: string;
  tapContinue: string; stopTalking: string; mute: string; unmute: string; callTime: string; conversation: string;
  typing: string; dismiss: string; micBlocked: string; unavailable: string; busy: string; failed: string; connection: string;
};

const en: Strings = {
  typeHere: "Type your message…", send: "Send message", startCall: "Start a voice call", endCall: "End call", talk: "Talk",
  minimise: "Minimise chat", newConv: "New conversation", clearConv: "End and clear the conversation", chatWith: "Chat with {name}",
  greeting: "Hi! I'm {name}. Ask me anything. You can type here or tap the headset to talk.", talkHuman: "Talk to a human",
  call: "Call", whatsapp: "WhatsApp", email: "Email", disclosure: "AI assistant · may make mistakes", privacy: "Privacy",
  poweredBy: "Powered by TechThrust", reconnecting: "Reconnecting…", tapContinue: "Tap to continue talking", stopTalking: "Stop talking",
  mute: "Mute", unmute: "Unmute", callTime: "Call time", conversation: "Conversation", typing: "Typing", dismiss: "Dismiss",
  micBlocked: "Microphone access was blocked.", unavailable: "The assistant is unavailable right now.",
  busy: "Too many requests, please try again in a moment.", failed: "Could not start the assistant. Please try again.", connection: "Connection error",
};

const ar: Strings = {
  typeHere: "اكتب رسالتك…", send: "إرسال الرسالة", startCall: "بدء مكالمة صوتية", endCall: "إنهاء المكالمة", talk: "تحدّث",
  minimise: "تصغير المحادثة", newConv: "محادثة جديدة", clearConv: "إنهاء المحادثة ومسحها", chatWith: "تحدّث مع {name}",
  greeting: "مرحباً! أنا {name}. اسألني أي شيء. يمكنك الكتابة هنا أو الضغط على السماعة للتحدث.", talkHuman: "تحدّث مع موظف",
  call: "اتصال", whatsapp: "واتساب", email: "البريد الإلكتروني", disclosure: "مساعد ذكاء اصطناعي · قد يخطئ", privacy: "الخصوصية",
  poweredBy: "بدعم من TechThrust", reconnecting: "جارٍ إعادة الاتصال…", tapContinue: "اضغط لمتابعة الحديث", stopTalking: "إيقاف الكلام",
  mute: "كتم الصوت", unmute: "إلغاء الكتم", callTime: "مدة المكالمة", conversation: "المحادثة", typing: "يكتب", dismiss: "إغلاق",
  micBlocked: "تم حظر الوصول إلى الميكروفون.", unavailable: "المساعد غير متاح حالياً.",
  busy: "طلبات كثيرة، يرجى المحاولة بعد قليل.", failed: "تعذّر تشغيل المساعد. حاول مرة أخرى.", connection: "خطأ في الاتصال",
};

const ur: Strings = {
  typeHere: "اپنا پیغام لکھیں…", send: "پیغام بھیجیں", startCall: "صوتی کال شروع کریں", endCall: "کال ختم کریں", talk: "بات کریں",
  minimise: "چیٹ چھوٹی کریں", newConv: "نئی گفتگو", clearConv: "گفتگو ختم کر کے صاف کریں", chatWith: "{name} سے بات کریں",
  greeting: "السلام علیکم! میں {name} ہوں۔ مجھ سے کچھ بھی پوچھیں۔ یہاں لکھیں یا بات کرنے کے لیے ہیڈسیٹ دبائیں۔", talkHuman: "کسی نمائندے سے بات کریں",
  call: "کال", whatsapp: "واٹس ایپ", email: "ای میل", disclosure: "اے آئی اسسٹنٹ · غلطی ہو سکتی ہے", privacy: "رازداری",
  poweredBy: "TechThrust کے تعاون سے", reconnecting: "دوبارہ جڑ رہا ہے…", tapContinue: "بات جاری رکھنے کے لیے دبائیں", stopTalking: "بولنا بند کریں",
  mute: "آواز بند کریں", unmute: "آواز کھولیں", callTime: "کال کا وقت", conversation: "گفتگو", typing: "لکھ رہا ہے", dismiss: "بند کریں",
  micBlocked: "مائیکروفون تک رسائی روک دی گئی۔", unavailable: "اسسٹنٹ اس وقت دستیاب نہیں ہے۔",
  busy: "بہت زیادہ درخواستیں، تھوڑی دیر بعد کوشش کریں۔", failed: "اسسٹنٹ شروع نہیں ہو سکا۔ دوبارہ کوشش کریں۔", connection: "کنکشن کی خرابی",
};

const hi: Strings = {
  typeHere: "अपना संदेश लिखें…", send: "संदेश भेजें", startCall: "वॉइस कॉल शुरू करें", endCall: "कॉल समाप्त करें", talk: "बात करें",
  minimise: "चैट छोटा करें", newConv: "नई बातचीत", clearConv: "बातचीत समाप्त करें और मिटाएँ", chatWith: "{name} से चैट करें",
  greeting: "नमस्ते! मैं {name} हूँ। मुझसे कुछ भी पूछें। यहाँ लिखें या बात करने के लिए हेडसेट दबाएँ।", talkHuman: "किसी व्यक्ति से बात करें",
  call: "कॉल", whatsapp: "व्हाट्सऐप", email: "ईमेल", disclosure: "एआई सहायक · गलती हो सकती है", privacy: "गोपनीयता",
  poweredBy: "TechThrust द्वारा संचालित", reconnecting: "फिर से जुड़ रहा है…", tapContinue: "बात जारी रखने के लिए टैप करें", stopTalking: "बोलना बंद करें",
  mute: "म्यूट करें", unmute: "अनम्यूट करें", callTime: "कॉल का समय", conversation: "बातचीत", typing: "लिख रहा है", dismiss: "बंद करें",
  micBlocked: "माइक्रोफ़ोन की अनुमति नहीं मिली।", unavailable: "सहायक अभी उपलब्ध नहीं है।",
  busy: "बहुत सारे अनुरोध, कृपया थोड़ी देर बाद प्रयास करें।", failed: "सहायक शुरू नहीं हो सका। फिर से प्रयास करें।", connection: "कनेक्शन त्रुटि",
};

const fr: Strings = {
  typeHere: "Écrivez votre message…", send: "Envoyer le message", startCall: "Démarrer un appel vocal", endCall: "Raccrocher", talk: "Parler",
  minimise: "Réduire le chat", newConv: "Nouvelle conversation", clearConv: "Terminer et effacer la conversation", chatWith: "Discuter avec {name}",
  greeting: "Bonjour ! Je suis {name}. Posez-moi vos questions. Écrivez ici ou touchez le casque pour parler.", talkHuman: "Parler à un conseiller",
  call: "Appeler", whatsapp: "WhatsApp", email: "E-mail", disclosure: "Assistant IA · peut se tromper", privacy: "Confidentialité",
  poweredBy: "Propulsé par TechThrust", reconnecting: "Reconnexion…", tapContinue: "Touchez pour continuer à parler", stopTalking: "Arrêter de parler",
  mute: "Couper le micro", unmute: "Réactiver le micro", callTime: "Durée de l'appel", conversation: "Conversation", typing: "En train d'écrire", dismiss: "Fermer",
  micBlocked: "L'accès au micro a été bloqué.", unavailable: "L'assistant n'est pas disponible pour le moment.",
  busy: "Trop de demandes, réessayez dans un instant.", failed: "Impossible de démarrer l'assistant. Réessayez.", connection: "Erreur de connexion",
};

const es: Strings = {
  typeHere: "Escribe tu mensaje…", send: "Enviar mensaje", startCall: "Iniciar llamada de voz", endCall: "Colgar", talk: "Hablar",
  minimise: "Minimizar chat", newConv: "Nueva conversación", clearConv: "Terminar y borrar la conversación", chatWith: "Chatear con {name}",
  greeting: "¡Hola! Soy {name}. Pregúntame lo que quieras. Escribe aquí o toca los auriculares para hablar.", talkHuman: "Hablar con una persona",
  call: "Llamar", whatsapp: "WhatsApp", email: "Correo", disclosure: "Asistente de IA · puede equivocarse", privacy: "Privacidad",
  poweredBy: "Con la tecnología de TechThrust", reconnecting: "Reconectando…", tapContinue: "Toca para seguir hablando", stopTalking: "Dejar de hablar",
  mute: "Silenciar", unmute: "Activar micrófono", callTime: "Duración de la llamada", conversation: "Conversación", typing: "Escribiendo", dismiss: "Cerrar",
  micBlocked: "Se bloqueó el acceso al micrófono.", unavailable: "El asistente no está disponible ahora.",
  busy: "Demasiadas solicitudes, inténtalo en un momento.", failed: "No se pudo iniciar el asistente. Inténtalo de nuevo.", connection: "Error de conexión",
};

const de: Strings = {
  typeHere: "Nachricht eingeben…", send: "Nachricht senden", startCall: "Sprachanruf starten", endCall: "Anruf beenden", talk: "Sprechen",
  minimise: "Chat minimieren", newConv: "Neues Gespräch", clearConv: "Gespräch beenden und löschen", chatWith: "Mit {name} chatten",
  greeting: "Hallo! Ich bin {name}. Fragen Sie mich alles. Schreiben Sie hier oder tippen Sie auf das Headset, um zu sprechen.", talkHuman: "Mit einem Menschen sprechen",
  call: "Anrufen", whatsapp: "WhatsApp", email: "E-Mail", disclosure: "KI-Assistent · kann Fehler machen", privacy: "Datenschutz",
  poweredBy: "Bereitgestellt von TechThrust", reconnecting: "Verbindung wird wiederhergestellt…", tapContinue: "Tippen, um weiterzusprechen", stopTalking: "Nicht mehr sprechen",
  mute: "Stummschalten", unmute: "Stummschaltung aufheben", callTime: "Gesprächsdauer", conversation: "Gespräch", typing: "Schreibt", dismiss: "Schließen",
  micBlocked: "Der Mikrofonzugriff wurde blockiert.", unavailable: "Der Assistent ist gerade nicht verfügbar.",
  busy: "Zu viele Anfragen, bitte gleich noch einmal versuchen.", failed: "Der Assistent konnte nicht gestartet werden. Bitte erneut versuchen.", connection: "Verbindungsfehler",
};

const pt: Strings = {
  typeHere: "Escreva sua mensagem…", send: "Enviar mensagem", startCall: "Iniciar chamada de voz", endCall: "Encerrar chamada", talk: "Falar",
  minimise: "Minimizar chat", newConv: "Nova conversa", clearConv: "Encerrar e apagar a conversa", chatWith: "Conversar com {name}",
  greeting: "Olá! Eu sou {name}. Pergunte o que quiser. Escreva aqui ou toque no fone para falar.", talkHuman: "Falar com uma pessoa",
  call: "Ligar", whatsapp: "WhatsApp", email: "E-mail", disclosure: "Assistente de IA · pode cometer erros", privacy: "Privacidade",
  poweredBy: "Desenvolvido por TechThrust", reconnecting: "Reconectando…", tapContinue: "Toque para continuar falando", stopTalking: "Parar de falar",
  mute: "Silenciar", unmute: "Ativar microfone", callTime: "Duração da chamada", conversation: "Conversa", typing: "Digitando", dismiss: "Fechar",
  micBlocked: "O acesso ao microfone foi bloqueado.", unavailable: "O assistente não está disponível agora.",
  busy: "Muitas solicitações, tente novamente em instantes.", failed: "Não foi possível iniciar o assistente. Tente novamente.", connection: "Erro de conexão",
};

const TABLE: Record<string, Strings> = { en, ar, ur, hi, fr, es, de, pt };
const RTL = new Set(["ar", "ur"]);

export const strings = (lang: string): Strings => TABLE[lang] ?? en;
export const isRtl = (lang: string) => RTL.has(lang);
export const fill = (s: string, name: string) => s.replace("{name}", name);
