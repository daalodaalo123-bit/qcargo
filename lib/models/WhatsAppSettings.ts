import mongoose, { Document, Schema } from 'mongoose';

// Single global WhatsApp-config document. Holds the Meta WhatsApp Cloud API
// credentials the office pastes from the Meta for Developers dashboard, plus
// the auto-reply "robot" settings (routing numbers + Somali menu texts).
// Admin-only. The access token is a secret — never expose it to non-admins.

// ─── Somali auto-reply defaults (the office can edit these in Settings) ───────
const DEFAULT_WELCOME = `👋 Ku soo dhawoow Q Cargo!
Waxaan ku faraxsanahay inaad nala soo xiriirtay.

Waxaan kaa caawin karnaa:
✅ Soo dejinta alaabaha Shiinaha
✅ Sourcing (Helidda alaabta)
✅ Air Cargo ✈️
✅ Sea Cargo 🚢
✅ Customs & Clearance
✅ Hubinta Tayada (Quality Inspection)

Fadlan dooro adeegga aad u baahan tahay 👇`;

const DEFAULT_SHIPMENT = `📦 La Soco Shixnaddaada

Haddii aad rabto inaad ogaato halka ay marayso shixnaddaadu ama xaaladdeeda, fadlan la xiriir kooxda Hawlgalka.

👇 Guji badhanka hoose.`;

const DEFAULT_PRODUCTS = `🛍️ Alaab & Qiime

Waxaan kaa caawin karnaa:
• Helidda alaab kasta oo Shiinaha laga soo iibiyo
• Qiimeynta alaabta
• Soo helidda warshadaha (Factories)
• Hubinta tayada
• Diyaarinta shipping-ka

👇 Guji badhanka hoose.`;

const DEFAULT_AIR = `✈️ Air Cargo

Air Cargo waa habka ugu dhaqsaha badan ee alaabta looga soo raro Shiinaha.
Waxa lagu xisaabiyaa Kiilo (KG).

Ku habboon:
✅ Dhar
✅ Electronics
✅ Daawooyin (haddii la oggol yahay)
✅ Qaybaha degdegga ah
✅ Alaabo qiimo sare leh

Celcelis ahaan waxay qaadataa: 7–12 maalmood

Haddii aad rabto qiimaha ugu dambeeya:
👇 La hadal kooxda iibka.`;

const DEFAULT_SEA = `🚢 Sea Cargo

Sea Cargo waa habka ugu jaban ee alaab badan lagu soo dejiyo.
Waxa lagu xisaabiyaa: CBM (Cubic Meter)

Ku habboon:
✅ Furniture
✅ Tiles
✅ Dhismaha
✅ Mashiinnada
✅ Alaab culus

Celcelis ahaan: 30–45 maalmood

👇 Guji badhanka hoose si aad u hesho qiimaha.`;

const DEFAULT_ABOUT = `🏢 Ku Saabsan Q Cargo

Q Cargo waa shirkad bixisa adeegyada:
✅ Sourcing gudaha Shiinaha
✅ Hubinta tayada alaabta
✅ Wada xaajoodka warshadaha
✅ Air Cargo
✅ Sea Cargo
✅ Customs Clearance
✅ Gaarsiinta Soomaaliya

Waxaan kaa caawinaynaa inaad si ammaan ah oo qiimo jaban uga soo iibsato Shiinaha.`;

const DEFAULT_FAQ = `❓ Su'aalaha Inta Badan La Is Weydiiyo

1. Ma ii heli kartaan alaab kasta?
Haa. Waxaan kuu heli karnaa ku dhawaad alaab kasta oo laga soo saaro Shiinaha.

2. Ma hubisaan tayada alaabta?
Haa. Waxaan sameynaa Quality Inspection ka hor inta aan alaabta la soo dirin.

3. Ma bixisaan adeegga Customs?
Haa. Waxaan kaa caawinaynaa dhammaan nidaamka.

4. Sidee lacagta loo bixiyaa?
Kooxdayada iibka ayaa ku siin doonta dhammaan faahfaahinta lacag bixinta.

5. Ma la socon karaa shixnaddayda?
Haa. Waxaan ku siin doonaa xogta ugu dambeysa ee shixnaddaada.`;

export interface IWhatsAppSettings extends Document {
  phoneNumberId: string;        // Meta "Phone Number ID"
  wabaId: string;               // WhatsApp Business Account ID
  accessToken: string;          // permanent System-User token (or temp test token)
  apiVersion: string;           // graph API version, e.g. v21.0
  enabled: boolean;             // master on/off switch
  senderLabel: string;          // friendly name for the sending number (display only)
  templateLang: string;         // language code used by the templates, e.g. en_US
  invoiceTemplate: string;      // approved Utility template name for invoices
  quotationTemplate: string;    // approved Utility template name for quotations
  otpTemplate: string;          // approved Authentication template name for login codes

  // ── Auto-reply "robot" (webhook) ──
  botEnabled: boolean;          // turn the automated Somali menu on/off
  webhookVerifyToken: string;   // secret string Meta echoes back to verify the webhook
  operationNumber: string;      // ops number customers are routed to (intl digits, e.g. 252638884835)
  salesNumber: string;          // sales number customers are routed to (intl digits)
  botWelcome: string;           // main menu greeting
  botShipmentText: string;      // option 1 text
  botProductsText: string;      // option 2 text
  botAirText: string;           // option 3 text
  botSeaText: string;           // option 4 text
  botAboutText: string;         // option 5 text
  botFaqText: string;           // option 6 text
}

const WhatsAppSettingsSchema = new Schema<IWhatsAppSettings>({
  phoneNumberId: { type: String, default: '' },
  wabaId: { type: String, default: '' },
  accessToken: { type: String, default: '' },
  apiVersion: { type: String, default: 'v21.0' },
  enabled: { type: Boolean, default: false },
  senderLabel: { type: String, default: '' },
  templateLang: { type: String, default: 'en_US' },
  invoiceTemplate: { type: String, default: '' },
  quotationTemplate: { type: String, default: '' },
  otpTemplate: { type: String, default: '' },

  botEnabled: { type: Boolean, default: false },
  webhookVerifyToken: { type: String, default: '' },
  operationNumber: { type: String, default: '' },
  salesNumber: { type: String, default: '' },
  botWelcome: { type: String, default: DEFAULT_WELCOME },
  botShipmentText: { type: String, default: DEFAULT_SHIPMENT },
  botProductsText: { type: String, default: DEFAULT_PRODUCTS },
  botAirText: { type: String, default: DEFAULT_AIR },
  botSeaText: { type: String, default: DEFAULT_SEA },
  botAboutText: { type: String, default: DEFAULT_ABOUT },
  botFaqText: { type: String, default: DEFAULT_FAQ },
}, { timestamps: true });

export default mongoose.models.WhatsAppSettings ||
  mongoose.model<IWhatsAppSettings>('WhatsAppSettings', WhatsAppSettingsSchema);
