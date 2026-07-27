const LANG_KEY = 'tahdir_lang';

export const translations = {
  fr: {
    brand: 'Tahdir',
    tagline: 'Mauritanie · Concours & recrutements',
    nav: {
      home: 'Accueil',
      login: 'Connexion',
      admin: 'Admin',
      discover: 'Découvrir',
    },
    home: {
      hero:
        'La plateforme de préparation aux examens et concours : entraînez-vous avec des QCM chronométrés et une correction claire.',
      enterCode: 'Entrer mon code',
      howTitle: 'Comment ça fonctionne',
      howSubtitle:
        'Un parcours simple, pensé pour les candidats aux concours mauritaniens. Les questions peuvent être en français ou en arabe.',
      step1Title: 'Recevez votre code',
      step1Text:
        'Un code unique (ex. CONCOURS-XXXX) vous est fourni pour accéder à la plateforme.',
      step2Title: 'Choisissez un QCM',
      step2Text:
        'Parcourez les concours et profils disponibles, puis lancez le niveau qui vous convient.',
      step3Title: 'Entraînez-vous',
      step3Text:
        'Répondez sous chronomètre, validez, et consultez immédiatement le détail de vos réponses.',
      feat1Title: 'QCM progressifs',
      feat1Text:
        'Dix niveaux par profil, du plus accessible à Expert, pour monter en compétence étape par étape.',
      feat2Title: 'Chronomètre intégré',
      feat2Text:
        'Chaque épreuve démarre un compte à rebours. Gérez votre temps comme le jour du concours.',
      feat3Title: 'Correction détaillée',
      feat3Text:
        'À la fin, visualisez votre score et les bonnes réponses pour apprendre de chaque erreur.',
      feat4Title: 'Accès sécurisé',
      feat4Text:
        'Un code unique vous est remis. Une fois utilisé, il ne peut plus être partagé ni réutilisé.',
      feat5Title: 'Questions bilingues',
      feat5Text:
        'Les énoncés et réponses peuvent être rédigés en arabe ou en français selon le concours.',
      readyTitle: 'Prêt à commencer ?',
      readyText:
        "Saisissez votre code d'accès pour ouvrir votre session d'entraînement.",
      accessExams: 'Accéder aux épreuves',
      footer: 'Tahdir — Préparation aux concours · Mauritanie',
    },
    login: {
      title: 'Connexion candidat',
      subtitle:
        "Entrez le code unique qui vous a été remis. Il ne pourra être utilisé qu'une seule fois.",
      codeLabel: "Code d'accès unique",
      codeHint:
        'Une seule session active à la fois. Votre code devient invalide après la première connexion.',
      submit: 'Accéder aux épreuves',
      loading: 'Connexion…',
    },
    catalog: {
      subtitle: 'Choisissez un QCM pour commencer',
      loading: 'Chargement du catalogue…',
      backHome: "Retour à l'accueil",
      assigned:
        'Votre code est lié à un profil spécifique — seuls les QCM de ce profil sont affichés.',
      empty: 'Aucun concours disponible pour le moment.',
      level: 'Niveau {n}',
      minutes: '{n} min',
      questionsCount: '{n} questions',
      noQcm: 'Aucun QCM pour ce profil.',
      logout: 'Déconnexion',
      logoutTitle: 'Confirmer la déconnexion',
      logoutWarn:
        "Attention : votre code d'accès est à usage unique. Après déconnexion, vous ne pourrez plus vous reconnecter sans un nouveau code.",
      logoutConfirm: 'Se déconnecter',
      logoutCancel: 'Annuler',
    },
    quiz: {
      preparing: "Préparation de l'épreuve…",
      notFound: 'QCM introuvable',
      backCatalog: 'Retour au catalogue',
      results: 'Résultats',
      score: 'Score',
      scoreLocal:
        'de réussite — calculé localement, non enregistré sur le serveur.',
      backToCatalog: 'Retour au catalogue',
      restart: 'Recommencer (rechargement)',
      details: 'Détail des réponses',
      correct: 'Correct',
      incorrect: 'Incorrect',
      goodAnswer: '(bonne réponse)',
      yourChoice: '(votre choix)',
      questionOf: 'Question {current}/{total}',
      answered: '{n} répondues',
      multiHint: 'plusieurs réponses possibles',
      noQuestions: 'Ce QCM ne contient pas encore de questions.',
      prev: 'Précédent',
      next: 'Suivant',
      finish: 'Terminer',
      arabicNote: 'Les questions peuvent être en arabe ou en français.',
    },
    levels: {
      1: 'Facile',
      2: 'Très facile',
      3: 'Débutant',
      4: 'Élémentaire',
      5: 'Intermédiaire',
      6: 'Confirmé',
      7: 'Avancé',
      8: 'Difficile',
      9: 'Très difficile',
      10: 'Expert',
    },
    lang: {
      fr: 'Français',
      ar: 'العربية',
      switch: 'Langue',
    },
    admin: {
      backoffice: 'Back-office',
      dashboard: 'Tableau de bord',
      concours: 'Concours',
      profils: 'Profils',
      qcms: 'QCM',
      questions: 'Questions',
      codes: 'Codes',
      logout: 'Déconnexion',
      loginTitle: 'Connexion administrateur',
      username: 'Identifiant',
      password: 'Mot de passe',
      login: 'Se connecter',
      checking: 'Vérification…',
      questionsSubtitle:
        "Jusqu'à 50 questions par QCM · 4 choix · une ou plusieurs bonnes réponses. Les questions peuvent être en arabe ou en français.",
      importJson: 'Importer un fichier JSON',
      importHint: "Chargez jusqu'à 50 questions d'un coup pour ce QCM.",
      downloadExample: 'Télécharger un exemple',
      chooseJson: 'Choisir un fichier JSON',
      importing: 'Import…',
      replaceExisting: 'Remplacer les questions existantes',
      newQuestion: 'Nouvelle question ({n}/50)',
      questionText: 'Énoncé de la question (FR ou AR)',
      correct: 'Correcte',
      choiceText: 'Texte choix {label}',
      explanation: 'Explication (affichée après correction)',
      imageOptional: 'Image (optionnel)',
      addQuestion: 'Ajouter la question',
      save: 'Enregistrer',
      cancel: 'Annuler',
      edit: 'Modifier',
      delete: 'Supprimer',
      noQcm: 'Aucun QCM',
      arabicContentNote:
        'Astuce : vous pouvez saisir les énoncés et réponses entièrement en arabe.',
    },
  },
  ar: {
    brand: 'تَحضير',
    tagline: 'موريتانيا · المسابقات والتوظيف',
    nav: {
      home: 'الرئيسية',
      login: 'تسجيل الدخول',
      admin: 'الإدارة',
      discover: 'اكتشف',
    },
    home: {
      hero:
        'منصة التحضير للامتحانات والمسابقات: تدرب عبر أسئلة اختيار من متعدد مع مؤقت وتصحيح مفصل.',
      enterCode: 'أدخل رمزي',
      howTitle: 'كيف تعمل المنصة',
      howSubtitle:
        'مسار بسيط مخصص للمترشحين لمسابقات موريتانيا. يمكن أن تكون الأسئلة بالعربية أو بالفرنسية.',
      step1Title: 'احصل على رمزك',
      step1Text:
        'يُمنح لك رمز فريد (مثل CONCOURS-XXXX) للدخول إلى المنصة.',
      step2Title: 'اختر اختباراً',
      step2Text:
        'تصفح المسابقات والشعَب المتاحة، ثم ابدأ المستوى المناسب لك.',
      step3Title: 'تدرب',
      step3Text:
        'أجب ضمن الوقت المحدد، ثم اطّلع فوراً على تفاصيل إجاباتك.',
      feat1Title: 'اختبارات متدرجة',
      feat1Text:
        'عشرة مستويات لكل شعبة، من الأسهل إلى مستوى خبير، للتقدم خطوة بخطوة.',
      feat2Title: 'مؤقت مدمج',
      feat2Text:
        'يبدأ العد التنازلي مع كل اختبار. نظم وقتك كما في يوم المسابقة.',
      feat3Title: 'تصحيح مفصل',
      feat3Text:
        'في النهاية ترى درجتك والإجابات الصحيحة لتتعلم من أخطائك.',
      feat4Title: 'دخول آمن',
      feat4Text:
        'رمز فريد يُستخدم مرة واحدة فقط ولا يمكن مشاركته بعد الاستعمال.',
      feat5Title: 'أسئلة ثنائية اللغة',
      feat5Text:
        'يمكن صياغة الأسئلة والإجابات بالعربية أو بالفرنسية حسب المسابقة.',
      readyTitle: 'هل أنت مستعد؟',
      readyText: 'أدخل رمز الدخول لفتح جلسة التدريب الخاصة بك.',
      accessExams: 'الدخول إلى الاختبارات',
      footer: 'تَحضير — التحضير للمسابقات · موريتانيا',
    },
    login: {
      title: 'دخول المترشح',
      subtitle: 'أدخل الرمز الفريد الذي حصلت عليه. لا يمكن استخدامه إلا مرة واحدة.',
      codeLabel: 'رمز الدخول الفريد',
      codeHint:
        'جلسة واحدة فقط في نفس الوقت. يصبح الرمز غير صالح بعد أول استخدام.',
      submit: 'الدخول إلى الاختبارات',
      loading: 'جاري الدخول…',
    },
    catalog: {
      subtitle: 'اختر اختباراً للبدء',
      loading: 'جاري تحميل القائمة…',
      backHome: 'العودة إلى الرئيسية',
      assigned:
        'رمزك مرتبط بشعبة محددة — تظهر فقط اختبارات هذه الشعبة.',
      empty: 'لا توجد مسابقات متاحة حالياً.',
      level: 'المستوى {n}',
      minutes: '{n} د',
      questionsCount: '{n} أسئلة',
      noQcm: 'لا يوجد اختبار لهذه الشعبة.',
      logout: 'تسجيل الخروج',
      logoutTitle: 'تأكيد تسجيل الخروج',
      logoutWarn:
        'تنبيه: رمز الدخول يُستخدم مرة واحدة فقط. بعد تسجيل الخروج لن تتمكن من الدخول مجدداً بدون رمز جديد.',
      logoutConfirm: 'تسجيل الخروج',
      logoutCancel: 'إلغاء',
    },
    quiz: {
      preparing: 'جاري تجهيز الاختبار…',
      notFound: 'الاختبار غير موجود',
      backCatalog: 'العودة إلى القائمة',
      results: 'النتائج',
      score: 'الدرجة',
      scoreLocal: 'نسبة النجاح — تُحسب محلياً ولا تُحفظ على الخادم.',
      backToCatalog: 'العودة إلى القائمة',
      restart: 'إعادة المحاولة (تحديث الصفحة)',
      details: 'تفاصيل الإجابات',
      correct: 'صحيح',
      incorrect: 'خطأ',
      goodAnswer: '(الإجابة الصحيحة)',
      yourChoice: '(اختيارك)',
      questionOf: 'السؤال {current}/{total}',
      answered: '{n} مجابة',
      multiHint: 'يمكن اختيار أكثر من إجابة',
      noQuestions: 'لا يحتوي هذا الاختبار على أسئلة بعد.',
      prev: 'السابق',
      next: 'التالي',
      finish: 'إنهاء',
      arabicNote: 'يمكن أن تكون الأسئلة بالعربية أو بالفرنسية.',
    },
    levels: {
      1: 'سهل',
      2: 'سهل جداً',
      3: 'مبتدئ',
      4: 'أساسي',
      5: 'متوسط',
      6: 'متقدم',
      7: 'متطور',
      8: 'صعب',
      9: 'صعب جداً',
      10: 'خبير',
    },
    lang: {
      fr: 'Français',
      ar: 'العربية',
      switch: 'اللغة',
    },
    admin: {
      backoffice: 'لوحة الإدارة',
      dashboard: 'لوحة التحكم',
      concours: 'المسابقات',
      profils: 'الشُّعب',
      qcms: 'الاختبارات',
      questions: 'الأسئلة',
      codes: 'الرموز',
      logout: 'تسجيل الخروج',
      loginTitle: 'دخول المسؤول',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      login: 'تسجيل الدخول',
      checking: 'جاري التحقق…',
      questionsSubtitle:
        'حتى 50 سؤالاً لكل اختبار · 4 خيارات · إجابة صحيحة واحدة أو أكثر. يمكن أن تكون الأسئلة بالعربية أو بالفرنسية.',
      importJson: 'استيراد ملف JSON',
      importHint: 'حمّل حتى 50 سؤالاً دفعة واحدة لهذا الاختبار.',
      downloadExample: 'تحميل نموذج',
      chooseJson: 'اختيار ملف JSON',
      importing: 'جاري الاستيراد…',
      replaceExisting: 'استبدال الأسئلة الحالية',
      newQuestion: 'سؤال جديد ({n}/50)',
      questionText: 'نص السؤال (عربي أو فرنسي)',
      correct: 'صحيحة',
      choiceText: 'نص الخيار {label}',
      explanation: 'الشرح (يظهر بعد التصحيح)',
      imageOptional: 'صورة (اختياري)',
      addQuestion: 'إضافة السؤال',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      noQcm: 'لا يوجد اختبار',
      arabicContentNote:
        'ملاحظة: يمكنك كتابة الأسئلة والإجابات بالكامل بالعربية.',
    },
  },
};

export function getStoredLang() {
  const stored = localStorage.getItem(LANG_KEY);
  return stored === 'ar' || stored === 'fr' ? stored : 'fr';
}

export function storeLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function t(lang, path, vars = {}) {
  const parts = path.split('.');
  let cur = translations[lang] || translations.fr;
  for (const p of parts) {
    cur = cur?.[p];
  }
  if (typeof cur !== 'string') {
    cur = translations.fr;
    for (const p of parts) cur = cur?.[p];
  }
  if (typeof cur !== 'string') return path;
  return cur.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

/** Détecte si un texte contient de l'arabe (pour dir=rtl sur le contenu) */
export function isArabicText(text) {
  return /[\u0600-\u06FF]/.test(String(text || ''));
}

export function textDir(text) {
  return isArabicText(text) ? 'rtl' : 'ltr';
}
