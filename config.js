// Instellingen van het onderzoek. Alleen dit bestand hoeft u aan te passen.
// Plak hieronder de Web-app link van uw Google Apps Script (eindigt op /exec).
window.SURVEY_CONFIG = {
  endpoint: "",
  claims: {
    A: "Onze boeren ontvangen een extra beloning voor iedere liter melk als ze extra aandacht besteden aan koe, natuur en klimaat.",
    B: "Jelle en Femke Hoekstra nemen deel aan ons zuivelprogramma, waardoor koe, natuur en boer met elkaar in balans zijn. Zo kan jij lekker genieten van duurzamere verse producten uit Nederland. Beter voor iedereen dus!",
    C: "Van iedere liter die wij verkopen, gaat er 2 ct rechtstreeks terug de natuur in middels een natuurfonds. Alle deelnemende boeren kunnen op basis van natuurprestaties aanspraak maken op dat fonds. De boer die het meest doet voor de optimalisatie van de weidevogelstand, ontvangt de meeste vergoeding. Dit systeem is opgezet met Vogelbescherming Nederland en wordt gecontroleerd door de lokale agrarische natuurvereniging."
  }
};
// Versie D is precies tekst B gevolgd door tekst C.
window.SURVEY_CONFIG.claims.D = window.SURVEY_CONFIG.claims.B + " " + window.SURVEY_CONFIG.claims.C;
