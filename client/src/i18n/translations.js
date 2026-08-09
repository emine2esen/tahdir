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
        'Un code unique vous est remis, valable de 1 jour à 1 mois. Une seule session à la fois : une nouvelle connexion déconnecte les autres.',
      feat5Title: 'Questions bilingues',
      feat5Text:
        'Les énoncés et réponses peuvent être rédigés en arabe ou en français selon le concours.',
      readyTitle: 'Prêt à commencer ?',
      readyText:
        "Saisissez votre code d'accès pour ouvrir votre session d'entraînement.",
      accessExams: 'Accéder aux épreuves',
      footer: 'Tahdir — Préparation aux concours · Mauritanie',
      requestCode: 'Demander un code',
      requestCodeNotice:
        "Le code d'accès vous est fourni par téléphone ou sur WhatsApp au 36949445.",
      availabilityNotice:
        "Certains recrutements ou profils peuvent ne pas être disponibles pour le moment, mais notre équipe travaille activement à compléter l'ensemble des profils et concours.",
    },
    dev: {
      label: 'Développeur',
      name: 'Emine Youbah',
      contact: 'Contacter sur WhatsApp',
    },
    login: {
      title: 'Connexion candidat',
      subtitle:
        "Entrez le code unique qui vous a été remis. Il reste valable jusqu'à sa date d'expiration.",
      codeLabel: "Code d'accès unique",
      codeHint:
        'Une seule session active à la fois. Vous pouvez vous reconnecter avec le même code tant qu\'il n\'a pas expiré (1 jour à 1 mois selon votre abonnement).',
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
        "Après déconnexion, une seule session reste possible. Vous pourrez vous reconnecter avec le même code tant qu'il n'a pas expiré (1 jour à 1 mois selon votre abonnement). Deux sessions simultanées ne sont pas autorisées.",
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
      langFallbackFr: "Cette question n'existe qu'en français.",
      langFallbackAr: "Cette question n'existe qu'en arabe.",
      quit: 'Quitter',
      quitConfirm: 'Voulez-vous vraiment quitter ? Votre progression sera perdue.',
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
    sim: {
      title: 'Simulation gratuite',
      subtitle:
        'Choisissez un recrutement et un profil, puis entraînez-vous sur 5 questions.',
      pickConcours: 'Recrutement / Concours',
      pickProfil: 'Profil / شعبة',
      start: 'Commencer la simulation (5 questions)',
      starting: 'Chargement…',
      loading: 'Chargement…',
      progress: 'Question {current}/{total}',
      noQuestions: 'Aucune question disponible pour ce profil pour le moment.',
      ctaText:
        'Souhaitez-vous compléter votre évaluation ? Contactez-nous au numéro',
      whatsapp: 'Demander mon code sur WhatsApp',
      retry: 'Réessayer',
      fullAccess: 'J’ai un code d’accès',
      tryFromHome: 'Essayer la simulation',
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
        "Aucune limite de questions par QCM · 2 à 6 choix · une ou plusieurs bonnes réponses. Les questions peuvent être en arabe ou en français.",
      importJson: 'Importer un fichier JSON',
      importHint:
        "Chargez un fichier JSON par langue (arabe et/ou français), question par question dans le même ordre. Si une question n'a pas de version dans une langue, laissez-la vide ou omettez-la à la fin du fichier : elle restera disponible dans l'autre langue.",
      downloadExample: 'Télécharger un exemple',
      chooseJsonAr: 'Fichier JSON — Arabe',
      chooseJsonFr: 'Fichier JSON — Français',
      importSeparateBtn: 'Importer',
      importSeparateNeedOne: 'Choisissez au moins un fichier (arabe ou français)',
      importing: 'Import…',
      replaceExisting: 'Remplacer les questions existantes',
      newQuestion: 'Nouvelle question (#{n})',
      questionText: 'Énoncé de la question (FR ou AR)',
      questionTextFr: 'Énoncé (Français)',
      questionTextAr: 'Énoncé (Arabe)',
      simulation: 'Simulation',
      correct: 'Correcte',
      choiceText: 'Texte choix {label}',
      choiceTextFr: 'Choix {label} (Français)',
      choiceTextAr: 'Choix {label} (Arabe)',
      addChoice: '+ Ajouter un choix',
      removeChoice: 'Retirer',
      explanation: 'Explication (affichée après correction)',
      explanationFr: 'Explication (Français)',
      explanationAr: 'Explication (Arabe)',
      bilingualHint:
        'Renseignez au moins une langue par champ. Les deux langues sont recommandées pour que la question soit disponible en français et en arabe.',
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
        'رمز فريد صالح من يوم إلى شهر. جلسة واحدة فقط في نفس الوقت — كل دخول جديد يُنهي الجلسات الأخرى.',
      feat5Title: 'أسئلة ثنائية اللغة',
      feat5Text:
        'يمكن صياغة الأسئلة والإجابات بالعربية أو بالفرنسية حسب المسابقة.',
      readyTitle: 'هل أنت مستعد؟',
      readyText: 'أدخل رمز الدخول لفتح جلسة التدريب الخاصة بك.',
      accessExams: 'الدخول إلى الاختبارات',
      footer: 'تَحضير — التحضير للمسابقات · موريتانيا',
      requestCode: 'طلب رمز',
      requestCodeNotice: 'يُسلَّم لك رمز الدخول عبر الهاتف أو واتساب على الرقم 36949445.',
      availabilityNotice:
        'قد لا تكون بعض المسابقات أو الشُّعب متاحة حالياً، لكن فريقنا يعمل باستمرار على استكمال جميع الشُّعب والمسابقات.',
    },
    dev: {
      label: 'المطوّر',
      name: 'Emine Youbah',
      contact: 'تواصل عبر واتساب',
    },
    login: {
      title: 'دخول المترشح',
      subtitle: 'أدخل الرمز الفريد الذي حصلت عليه. يبقى صالحاً حتى تاريخ انتهائه.',
      codeLabel: 'رمز الدخول الفريد',
      codeHint:
        'جلسة واحدة فقط في نفس الوقت. يمكنك الدخول مجدداً بنفس الرمز طالما لم تنتهِ صلاحيته (من يوم إلى شهر حسب اشتراكك).',
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
        'بعد تسجيل الخروج يمكنك الدخول مجدداً بنفس الرمز طالما لم تنتهِ صلاحيته (من يوم إلى شهر حسب اشتراكك). لا يُسمح بجلستين في نفس الوقت.',
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
      langFallbackFr: 'هذا السؤال متوفر بالفرنسية فقط.',
      langFallbackAr: 'هذا السؤال متوفر بالعربية فقط.',
      quit: 'خروج',
      quitConfirm: 'هل تريد فعلاً الخروج؟ سيتم فقدان تقدمك.',
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
    sim: {
      title: 'محاكاة مجانية',
      subtitle: 'اختر مسابقة وشعبة ثم تدرب على 5 أسئلة.',
      pickConcours: 'المسابقة / التوظيف',
      pickProfil: 'الشعبة',
      start: 'بدء المحاكاة (5 أسئلة)',
      starting: 'جاري التحميل…',
      loading: 'جاري التحميل…',
      progress: 'السؤال {current}/{total}',
      noQuestions: 'لا توجد أسئلة متاحة لهذه الشعبة حالياً.',
      ctaText: 'هل تريد إكمال تقييمك؟ تواصل معنا على الرقم',
      whatsapp: 'طلب رمزي عبر واتساب',
      retry: 'إعادة المحاولة',
      fullAccess: 'لدي رمز دخول',
      tryFromHome: 'جرّب المحاكاة',
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
        'بدون حد أقصى لعدد الأسئلة لكل اختبار · من 2 إلى 6 خيارات · إجابة صحيحة واحدة أو أكثر. يمكن أن تكون الأسئلة بالعربية أو بالفرنسية.',
      importJson: 'استيراد ملف JSON',
      importHint:
        'حمّل ملف JSON لكل لغة (عربي و/أو فرنسي)، بنفس ترتيب الأسئلة. إذا لم يكن للسؤال نسخة بلغة ما، اتركه فارغاً أو احذفه من نهاية الملف: سيبقى متاحاً باللغة الأخرى.',
      downloadExample: 'تحميل نموذج',
      chooseJsonAr: 'ملف JSON — عربي',
      chooseJsonFr: 'ملف JSON — فرنسي',
      importSeparateBtn: 'استيراد',
      importSeparateNeedOne: 'اختر ملفاً واحداً على الأقل (عربي أو فرنسي)',
      importing: 'جاري الاستيراد…',
      replaceExisting: 'استبدال الأسئلة الحالية',
      newQuestion: 'سؤال جديد (#{n})',
      questionText: 'نص السؤال (عربي أو فرنسي)',
      questionTextFr: 'نص السؤال (بالفرنسية)',
      questionTextAr: 'نص السؤال (بالعربية)',
      simulation: 'محاكاة',
      correct: 'صحيحة',
      choiceText: 'نص الخيار {label}',
      choiceTextFr: 'الخيار {label} (بالفرنسية)',
      choiceTextAr: 'الخيار {label} (بالعربية)',
      addChoice: '+ إضافة خيار',
      removeChoice: 'إزالة',
      explanation: 'الشرح (يظهر بعد التصحيح)',
      explanationFr: 'الشرح (بالفرنسية)',
      explanationAr: 'الشرح (بالعربية)',
      bilingualHint:
        'املأ لغة واحدة على الأقل في كل حقل. يُفضّل ملء اللغتين ليكون السؤال متاحاً بالفرنسية والعربية.',
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
  return stored === 'ar' || stored === 'fr' ? stored : 'ar';
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
