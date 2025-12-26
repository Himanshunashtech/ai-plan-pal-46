import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    en: {
        translation: {
            "settings": "Settings",
            "personal_details": "Personal details",
            "adjust_macros": "Adjust macronutrients",
            "goal_weight": "Goal & current weight",
            "weight_history": "Weight history",
            "language": "Language",
            "preferences": "Preferences",
            "appearance": "Appearance",
            "theme_desc": "Choose light, dark, or system",
            "add_burned": "Add Burned Calories",
            "add_burned_desc": "Add burned calories to daily goal",
            "rollover": "Rollover calories",
            "rollover_desc": "Add up to 200 left over calories from yesterday",
            "badge_cel": "Badge Celebrations",
            "badge_cel_desc": "Show celebrations when you unlock new badges",
            "widgets": "Widgets",
            "how_to_add": "How to add?",
            "terms": "Terms and Conditions",
            "privacy": "Privacy Policy",
            "support": "Support Email",
            "feature_req": "Feature Request",
            "delete_account": "Delete Account?",
            "logout": "Logout",
            "version": "Version"
        }
    },
    hi: {
        translation: {
            "settings": "सेटिंग्स",
            "personal_details": "व्यक्तिगत विवरण",
            "adjust_macros": "मैक्रोन्यूट्रिएंट्स समायोजित करें",
            "goal_weight": "लक्ष्य और वर्तमान वजन",
            "weight_history": "वजन का इतिहास",
            "language": "भाषा",
            "preferences": "प्राथमिकताएं",
            "appearance": "दिखावट",
            "theme_desc": "लाइट, डार्क या सिस्टम चुनें",
            "add_burned": "जली हुई कैलोरी जोड़ें",
            "add_burned_desc": "दैनिक लक्ष्य में जली हुई कैलोरी जोड़ें",
            "rollover": "रोलओवर कैलोरी",
            "rollover_desc": "कल से बची हुई 200 तक कैलोरी जोड़ें",
            "badge_cel": "बैज उत्सव",
            "badge_cel_desc": "नए बैज अनलॉक करने पर उत्सव दिखाएं",
            "widgets": "विजेट्स",
            "how_to_add": "कैसे जोड़ें?",
            "terms": "नियम और शर्तें",
            "privacy": "गोपनीयता नीति",
            "support": "सहायता ईमेल",
            "feature_req": "सुविधा अनुरोध",
            "delete_account": "खाता हटाएं?",
            "logout": "लॉग आउट",
            "version": "संस्करण"
        }
    },
    fr: {
        translation: {
            "settings": "Paramètres",
            "personal_details": "Détails personnels",
            "adjust_macros": "Ajuster les macronutriments",
            "goal_weight": "Poids cible et actuel",
            "weight_history": "Historique de poids",
            "language": "Langue",
            "preferences": "Préférences",
            "appearance": "Apparence",
            "theme_desc": "Choisir clair, sombre ou système",
            "add_burned": "Ajouter calories brûlées",
            "add_burned_desc": "Ajouter les calories brûlées à l'objectif quotidien",
            "rollover": "Reporter les calories",
            "rollover_desc": "Ajouter jusqu'à 200 calories restantes d'hier",
            "badge_cel": "Célébrations de badges",
            "badge_cel_desc": "Afficher les célébrations lors du déblocage de badges",
            "widgets": "Widgets",
            "how_to_add": "Comment ajouter ?",
            "terms": "Termes et conditions",
            "privacy": "Politique de confidentialité",
            "support": "Email de support",
            "feature_req": "Demande de fonctionnalité",
            "delete_account": "Supprimer le compte ?",
            "logout": "Se déconnecter",
            "version": "Version"
        }
    },
    de: {
        translation: {
            "settings": "Einstellungen",
            "personal_details": "Persönliche Daten",
            "adjust_macros": "Makronährstoffe anpassen",
            "goal_weight": "Ziel- & aktuelles Gewicht",
            "weight_history": "Gewichtsverlauf",
            "language": "Sprache",
            "preferences": "Präferenzen",
            "appearance": "Erscheinungsbild",
            "theme_desc": "Wählen Sie Hell, Dunkel oder System",
            "add_burned": "Verbrannte Kalorien hinzufügen",
            "add_burned_desc": "Verbrannte Kalorien zum Tagesziel hinzufügen",
            "rollover": "Kalorien übertragen",
            "rollover_desc": "Bis zu 200 übrig gebliebene Kalorien von gestern hinzufügen",
            "badge_cel": "Abzeichen-Feiern",
            "badge_cel_desc": "Feiern anzeigen, wenn neue Abzeichen freigeschaltet werden",
            "widgets": "Widgets",
            "how_to_add": "Wie hinzufügen?",
            "terms": "Allgemeine Geschäftsbedingungen",
            "privacy": "Datenschutzrichtlinie",
            "support": "Support-E-Mail",
            "feature_req": "Funktionsanfrage",
            "delete_account": "Konto löschen?",
            "logout": "Abmelden",
            "version": "Version"
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        }
    });

export default i18n;
